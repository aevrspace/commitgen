import { logger } from "@untools/logger";

// HTTP Client interfaces and types
export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export interface HttpClientConfig {
  baseUrl?: string;
  timeout?: number;
  defaultHeaders?: Record<string, string>;
  retries?: number;
  retryDelay?: number;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: string | object | FormData | Blob | ArrayBuffer;
  timeout?: number;
  retries?: number;
}

export interface HttpError extends Error {
  status?: number;
  statusText?: string;
  response?: string;
}

// Type guard to check if response is ApiResponse
export function isApiResponse<T>(
  response: unknown
): response is ApiResponse<T> {
  return (
    response !== null &&
    typeof response === "object" &&
    "data" in response &&
    "status" in response &&
    "statusText" in response &&
    "headers" in response
  );
}

export class HttpClient {
  private baseUrl: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;
  private retries: number;
  private retryDelay: number;

  constructor(config: HttpClientConfig = {}) {
    this.baseUrl = config.baseUrl || "";
    this.timeout = config.timeout || 30000; // 30 seconds default
    this.defaultHeaders = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...config.defaultHeaders,
    };
    this.retries = config.retries || 3;
    this.retryDelay = config.retryDelay || 1000; // 1 second default
  }

  /**
   * Create an HTTP error with additional context
   */
  private createHttpError(
    message: string,
    status?: number,
    statusText?: string,
    response?: string
  ): HttpError {
    const error = new Error(message) as HttpError;
    error.name = "HttpError";
    error.status = status;
    error.statusText = statusText;
    error.response = response;
    return error;
  }

  /**
   * Sleep utility for retry delays
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Build full URL from base URL and endpoint
   */
  private buildUrl(url: string): string {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    const base = this.baseUrl.endsWith("/")
      ? this.baseUrl.slice(0, -1)
      : this.baseUrl;
    const endpoint = url.startsWith("/") ? url : `/${url}`;

    return `${base}${endpoint}`;
  }

  /**
   * Make HTTP request with retry logic
   */
  async makeRequest<T = unknown>(
    url: string,
    options: RequestOptions = {}
  ): Promise<T | ApiResponse<T>> {
    const {
      method = "GET",
      headers = {},
      body,
      timeout = this.timeout,
      retries = this.retries,
    } = options;

    const fullUrl = this.buildUrl(url);
    const requestHeaders = { ...this.defaultHeaders, ...headers };

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    let lastError: HttpError | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        logger?.info(
          `Making ${method} request to ${fullUrl} (attempt ${attempt + 1}/${
            retries + 1
          })`
        );

        const requestInit: RequestInit = {
          method,
          headers: requestHeaders,
          signal: controller.signal,
        };

        // Add body for methods that support it
        if (body && ["POST", "PUT", "PATCH"].includes(method)) {
          if (typeof body === "string") {
            requestInit.body = body;
          } else if (
            body instanceof FormData ||
            body instanceof Blob ||
            body instanceof ArrayBuffer
          ) {
            requestInit.body = body;
          } else {
            requestInit.body = JSON.stringify(body);
          }
        }

        const response = await fetch(fullUrl, requestInit);
        clearTimeout(timeoutId);

        // Check if response is ok
        if (!response.ok) {
          const errorText = await response.text().catch(() => "Unknown error");
          throw this.createHttpError(
            `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            response.statusText,
            errorText
          );
        }

        // Parse response
        const contentType = response.headers.get("content-type") || "";
        let data: T;

        if (contentType.includes("application/json")) {
          data = (await response.json()) as T;
        } else {
          data = (await response.text()) as T;
        }

        // Convert headers to plain object
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        logger?.info(`Successfully completed ${method} request to ${fullUrl}`);

        // Return as ApiResponse format for consistency
        const apiResponse: ApiResponse<T> = {
          data,
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
        };

        return apiResponse;
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error) {
          if (error.name === "AbortError") {
            lastError = this.createHttpError(
              `Request timeout after ${timeout}ms`,
              408,
              "Request Timeout"
            );
          } else {
            lastError = error as HttpError;
          }
        } else {
          lastError = this.createHttpError("Unknown error occurred");
        }

        logger?.warn(
          `Request attempt ${attempt + 1} failed:`,
          lastError.message
        );

        // Don't retry on certain status codes
        if (
          lastError.status &&
          [400, 401, 403, 404, 422].includes(lastError.status)
        ) {
          break;
        }

        // Wait before retry (except on last attempt)
        if (attempt < retries) {
          const delay = this.retryDelay * Math.pow(2, attempt); // Exponential backoff
          logger?.info(`Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    // If we get here, all retries failed
    logger?.error(
      `All ${retries + 1} attempts failed for ${method} ${fullUrl}`
    );
    throw lastError;
  }
}
