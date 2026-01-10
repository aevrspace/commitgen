# Currency Feature Documentation

This document contains the complete implementation of the currency feature, including all necessary code, dependencies, and setup instructions. You can copy and paste this directly into your project.

## 1. Project Structure

To maintain the import paths used in the code below, organize your files as follows:

```
src/
├── utils/
│   ├── shared/
│   │   └── httpClient.ts
│   ├── currency/
│   │   └── currency.service.ts
│   └── aevr/
│       └── number-formatter.ts
├── store/
│   └── useCurrencyStore.ts
├── hooks/
│   └── useCurrency.ts
└── components/
    └── DemoCurrencyComponent.tsx
```

_Note: The code assumes you have a path alias `@/` pointing to your `src` directory (standard in Next.js). If not, adjust imports to relative paths (e.g., `../../utils/shared/httpClient`)._

## 2. Dependencies

Install the required packages:

```bash
npm install zustand @untools/logger iso-country-currency
```

_Note: If you don't want to use `@untools/logger`, you can replace `logger.info`, `logger.debug`, and `logger.error` with `console.log` and `console.error` in the code below._

---

## 2. Shared Utilities

### A. HTTP Client (`utils/shared/httpClient.ts`)

This is a robust wrapper around `fetch` with retry logic and typing.

```typescript
// ./utils/shared/httpClient.ts

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
  response: unknown,
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
    response?: string,
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
    options: RequestOptions = {},
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
          `Making ${method} request to ${fullUrl} (attempt ${attempt + 1}/${retries + 1})`,
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
            errorText,
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
              "Request Timeout",
            );
          } else {
            lastError = error as HttpError;
          }
        } else {
          lastError = this.createHttpError("Unknown error occurred");
        }

        logger?.warn(
          `Request attempt ${attempt + 1} failed:`,
          lastError.message,
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
      `All ${retries + 1} attempts failed for ${method} ${fullUrl}`,
    );
    throw lastError;
  }

  // Convenience methods (get, post, put, delete, patch) omitted for brevity but recommended.
}
```

### B. Number Formatter (`utils/aevr/number-formatter.ts`)

Helper for consistent number and currency formatting.

```typescript
// ./utils/aevr/number-formatter.ts

import { logger } from "@untools/logger";
import { getParamByParam } from "iso-country-currency";

interface FormatCurrencyOptions {
  currency?: string;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  display?: "code" | "symbol" | "both";
  symbolFirst?: boolean;
}

export function formatCurrency(
  value: number | undefined | null,
  options: FormatCurrencyOptions = {},
): string {
  const {
    currency = "USD",
    locale = "en-US",
    minimumFractionDigits: minFD = 2,
    maximumFractionDigits: maxFD = 5,
    display = "symbol",
    symbolFirst = true,
  } = options;

  let minimumFractionDigits = minFD < 0 ? 0 : minFD;
  let maximumFractionDigits = maxFD < 0 ? 0 : maxFD;

  if (minimumFractionDigits > maximumFractionDigits) {
    minimumFractionDigits = maximumFractionDigits;
  }

  try {
    const formattedNumber = new Intl.NumberFormat(locale, {
      style: "decimal",
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(value || 0);

    let symbol = "";
    if (display === "symbol" || display === "both") {
      try {
        const foundSymbol = getParamByParam("currency", currency, "symbol");
        if (foundSymbol) {
          symbol = foundSymbol;
        }
      } catch {
        return `${currency} ${formattedNumber}`;
      }
    }

    switch (display) {
      case "symbol":
        return symbol
          ? `${symbol}${formattedNumber}`
          : `${currency} ${formattedNumber}`;
      case "both":
        if (symbol) {
          return symbolFirst
            ? `${symbol} ${formattedNumber} (${currency})`
            : `${currency} ${formattedNumber} (${symbol})`;
        }
        return `${currency} ${formattedNumber}`;
      case "code":
      default:
        return `${currency} ${formattedNumber}`;
    }
  } catch (error) {
    logger.error("🚫 Something went wrong while formatting currency:", error);
    return `${currency} ${(value || 0).toFixed(Math.max(0, minimumFractionDigits))}`;
  }
}
```

---

## 3. Currency Logic

### A. Currency Service (`utils/currency/currency.service.ts`)

This service handles the actual API calls to CurrencyFreaks and local conversion math.

```typescript
// ./utils/currency/currency.service.ts

import { HttpClient, isApiResponse } from "@/utils/shared/httpClient"; // Adjust path
import { logger } from "@untools/logger";

// Currency interfaces
export interface CurrencyRate {
  [currencyCode: string]: string;
}

export interface CurrencyRatesResponse {
  date: string;
  base: string;
  rates: CurrencyRate;
}

export interface SupportedCurrency {
  currencyCode: string;
  currencyName: string;
  countryCode: string;
  countryName: string;
  status: string;
  availableFrom: string;
  availableUntil: string;
  icon: string;
}

export interface SupportedCurrenciesResponse {
  supportedCurrenciesMap: {
    [currencyCode: string]: SupportedCurrency;
  };
}

export interface CurrencyServiceConfig {
  httpClient: HttpClient;
  apiKey: string;
}

export class CurrencyService {
  private httpClient: HttpClient;
  private apiKey: string;
  private readonly baseUrl = "https://api.currencyfreaks.com/v2.0";

  constructor(config: CurrencyServiceConfig) {
    this.httpClient = config.httpClient;
    this.apiKey = config.apiKey;
  }

  async getLatestRates(
    symbols?: string,
    base: string = "USD",
  ): Promise<CurrencyRatesResponse> {
    try {
      const params = new URLSearchParams({
        apikey: this.apiKey,
        ...(symbols && { symbols }),
        ...(base !== "USD" && { base }),
      });
      logger?.info(`Fetching currency rates for symbols: ${symbols || "all"}`);
      const response = await this.httpClient.makeRequest<CurrencyRatesResponse>(
        `${this.baseUrl}/rates/latest?${params.toString()}`,
        { method: "GET" },
      );
      if (isApiResponse(response)) {
        return response.data;
      } else {
        return response as CurrencyRatesResponse;
      }
    } catch (error) {
      logger?.error(`Failed to fetch currency rates:`, error);
      throw error;
    }
  }

  async getSupportedCurrencies(): Promise<SupportedCurrenciesResponse> {
    try {
      logger?.info(`Fetching supported currencies`);
      const response =
        await this.httpClient.makeRequest<SupportedCurrenciesResponse>(
          `${this.baseUrl}/supported-currencies`,
          { method: "GET" },
        );
      if (isApiResponse(response)) {
        return response.data;
      } else {
        return response as SupportedCurrenciesResponse;
      }
    } catch (error) {
      logger?.error(`Failed to fetch supported currencies:`, error);
      throw error;
    }
  }

  async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
  ): Promise<number> {
    if (fromCurrency === toCurrency) return amount;

    // In a real app with cached rates, you might pass rates in or fetch them here
    // This implementation fetches fresh rates for accuracy on each convert call if not passed
    const rates = await this.getLatestRates(`${fromCurrency},${toCurrency}`);

    let convertedAmount: number;

    if (fromCurrency === rates.base) {
      const targetRate = parseFloat(rates.rates[toCurrency]);
      convertedAmount = amount * targetRate;
    } else if (toCurrency === rates.base) {
      const sourceRate = parseFloat(rates.rates[fromCurrency]);
      convertedAmount = amount / sourceRate;
    } else {
      const sourceRate = parseFloat(rates.rates[fromCurrency]);
      const targetRate = parseFloat(rates.rates[toCurrency]);
      convertedAmount = (amount / sourceRate) * targetRate;
    }

    return Math.round(convertedAmount * 100) / 100;
  }
}

export const createCurrencyService = (
  httpClient: HttpClient,
  apiKey: string,
): CurrencyService => {
  return new CurrencyService({ httpClient, apiKey });
};
```

### B. Currency Store (`store/useCurrencyStore.ts`)

Zustand store for global state management and persistence.

```typescript
// ./store/useCurrencyStore.ts

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  CurrencyRatesResponse,
  SupportedCurrency,
} from "@/utils/currency/currency.service"; // Adjust path

export interface CurrencyStoreState {
  rates: CurrencyRatesResponse | null;
  supportedCurrencies: { [currencyCode: string]: SupportedCurrency };
  isLoadingRates: boolean;
  isLoadingSupportedCurrencies: boolean;
  ratesError: string | null;
  supportedCurrenciesError: string | null;
  lastRatesUpdate: number | null;
  lastSupportedCurrenciesUpdate: number | null;
  ratesCacheDuration: number;
  supportedCurrenciesCacheDuration: number;
  baseCurrency: string;
  favoriteCurrencies: string[];

  setRates: (rates: CurrencyRatesResponse) => void;
  setSupportedCurrencies: (currencies: {
    [currencyCode: string]: SupportedCurrency;
  }) => void;
  setIsLoadingRates: (loading: boolean) => void;
  setIsLoadingSupportedCurrencies: (loading: boolean) => void;
  setRatesError: (error: string | null) => void;
  setSupportedCurrenciesError: (error: string | null) => void;
  setBaseCurrency: (currency: string) => void;
  addFavoriteCurrency: (currency: string) => void;
  removeFavoriteCurrency: (currency: string) => void;
  setFavoriteCurrencies: (currencies: string[]) => void;
  isRatesCacheExpired: () => boolean;
  isSupportedCurrenciesCacheExpired: () => boolean;
  getCurrencyRate: (currencyCode: string) => string | null;
  getSupportedCurrency: (currencyCode: string) => SupportedCurrency | null;
  getPopularCurrencies: () => SupportedCurrency[];
  clearRatesCache: () => void;
  clearSupportedCurrenciesCache: () => void;
  reset: () => void;
  isHydrated: boolean;
  setIsHydrated: (isHydrated: boolean) => void;
}

const useCurrencyStore = create<CurrencyStoreState>()(
  persist(
    (set, get) => ({
      rates: null,
      supportedCurrencies: {},
      isLoadingRates: false,
      isLoadingSupportedCurrencies: false,
      ratesError: null,
      supportedCurrenciesError: null,
      lastRatesUpdate: null,
      lastSupportedCurrenciesUpdate: null,
      ratesCacheDuration: 15 * 60 * 1000, // 15 minutes
      supportedCurrenciesCacheDuration: 24 * 60 * 60 * 1000, // 24 hours
      baseCurrency: "USD",
      favoriteCurrencies: ["USD", "EUR", "GBP", "NGN"],

      setRates: (rates) =>
        set({ rates, lastRatesUpdate: Date.now(), ratesError: null }),
      setSupportedCurrencies: (currencies) =>
        set({
          supportedCurrencies: currencies,
          lastSupportedCurrenciesUpdate: Date.now(),
          supportedCurrenciesError: null,
        }),
      setIsLoadingRates: (loading) => set({ isLoadingRates: loading }),
      setIsLoadingSupportedCurrencies: (loading) =>
        set({ isLoadingSupportedCurrencies: loading }),
      setRatesError: (error) =>
        set({ ratesError: error, isLoadingRates: false }),
      setSupportedCurrenciesError: (error) =>
        set({
          supportedCurrenciesError: error,
          isLoadingSupportedCurrencies: false,
        }),
      setBaseCurrency: (currency) => set({ baseCurrency: currency }),
      addFavoriteCurrency: (currency) => {
        const { favoriteCurrencies } = get();
        if (!favoriteCurrencies.includes(currency))
          set({ favoriteCurrencies: [...favoriteCurrencies, currency] });
      },
      removeFavoriteCurrency: (currency) => {
        const { favoriteCurrencies } = get();
        set({
          favoriteCurrencies: favoriteCurrencies.filter((c) => c !== currency),
        });
      },
      setFavoriteCurrencies: (currencies) =>
        set({ favoriteCurrencies: currencies }),
      isRatesCacheExpired: () => {
        const { lastRatesUpdate, ratesCacheDuration } = get();
        if (!lastRatesUpdate) return true;
        return Date.now() - lastRatesUpdate > ratesCacheDuration;
      },
      isSupportedCurrenciesCacheExpired: () => {
        const {
          lastSupportedCurrenciesUpdate,
          supportedCurrenciesCacheDuration,
        } = get();
        if (!lastSupportedCurrenciesUpdate) return true;
        return (
          Date.now() - lastSupportedCurrenciesUpdate >
          supportedCurrenciesCacheDuration
        );
      },
      getCurrencyRate: (currencyCode) =>
        get().rates?.rates[currencyCode] || null,
      getSupportedCurrency: (currencyCode) =>
        get().supportedCurrencies[currencyCode] || null,
      getPopularCurrencies: () => {
        const { supportedCurrencies } = get();
        return [
          "USD",
          "EUR",
          "GBP",
          "JPY",
          "CAD",
          "AUD",
          "CHF",
          "CNY",
          "NGN",
          "ZAR",
        ]
          .map((code) => supportedCurrencies[code])
          .filter(Boolean);
      },
      clearRatesCache: () =>
        set({ rates: null, lastRatesUpdate: null, ratesError: null }),
      clearSupportedCurrenciesCache: () =>
        set({
          supportedCurrencies: {},
          lastSupportedCurrenciesUpdate: null,
          supportedCurrenciesError: null,
        }),
      reset: () =>
        set({
          rates: null,
          supportedCurrencies: {},
          isLoadingRates: false,
          isLoadingSupportedCurrencies: false,
          ratesError: null,
          supportedCurrenciesError: null,
          lastRatesUpdate: null,
          lastSupportedCurrenciesUpdate: null,
          baseCurrency: "USD",
          favoriteCurrencies: ["USD", "EUR", "GBP", "NGN"],
        }),
      isHydrated: false,
      setIsHydrated: (isHydrated) => set({ isHydrated }),
    }),
    {
      name: "currencyStore",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        rates: state?.rates,
        supportedCurrencies: state?.supportedCurrencies,
        lastRatesUpdate: state?.lastRatesUpdate,
        lastSupportedCurrenciesUpdate: state?.lastSupportedCurrenciesUpdate,
        baseCurrency: state?.baseCurrency,
        favoriteCurrencies: state?.favoriteCurrencies,
        ratesCacheDuration: state?.ratesCacheDuration,
        supportedCurrenciesCacheDuration:
          state?.supportedCurrenciesCacheDuration,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setIsHydrated(true);
      },
    },
  ),
);

export default useCurrencyStore;
```

### C. Currency Hook (`hooks/useCurrency.ts`)

Connects everything together for React components.

```typescript
// ./hooks/useCurrency.ts

import { useCallback, useEffect, useMemo } from "react";
import { HttpClient } from "@/utils/shared/httpClient"; // Adjust path
import { createCurrencyService } from "@/utils/currency/currency.service"; // Adjust path
import useCurrencyStore from "@/store/useCurrencyStore"; // Adjust path

interface UseCurrencyConfig {
  httpClient?: HttpClient;
  apiKey?: string;
  autoFetchRates?: boolean;
  autoFetchSupportedCurrencies?: boolean;
}

const DEFAULT_HTTP_CLIENT = new HttpClient({
  baseUrl: "https://api.currencyfreaks.com",
});
// REPLACE WITH YOUR API KEY
const DEFAULT_API_KEY = "YOUR_API_KEY";

export const useCurrency = (config: UseCurrencyConfig = {}) => {
  const {
    httpClient = DEFAULT_HTTP_CLIENT,
    apiKey = DEFAULT_API_KEY,
    autoFetchRates = true,
    autoFetchSupportedCurrencies = true,
  } = config;

  const store = useCurrencyStore();

  // Stable service instance
  const currencyService = useMemo(
    () => createCurrencyService(httpClient, apiKey),
    [httpClient, apiKey],
  );

  const fetchRates = useCallback(
    async (symbols?: string, forceRefresh = false) => {
      if (!forceRefresh && !store.isRatesCacheExpired()) return;
      store.setIsLoadingRates(true);
      store.setRatesError(null);
      try {
        const ratesData = await currencyService.getLatestRates(
          symbols,
          store.baseCurrency,
        );
        store.setRates(ratesData);
      } catch (error) {
        store.setRatesError(
          error instanceof Error ? error.message : "Failed to fetch rates",
        );
      } finally {
        store.setIsLoadingRates(false);
      }
    },
    [currencyService, store.baseCurrency, store.isRatesCacheExpired],
  );

  const fetchSupportedCurrencies = useCallback(
    async (forceRefresh = false) => {
      if (!forceRefresh && !store.isSupportedCurrenciesCacheExpired()) return;
      store.setIsLoadingSupportedCurrencies(true);
      store.setSupportedCurrenciesError(null);
      try {
        const data = await currencyService.getSupportedCurrencies();
        store.setSupportedCurrencies(data.supportedCurrenciesMap);
      } catch (error) {
        store.setSupportedCurrenciesError(
          error instanceof Error ? error.message : "Failed to fetch currencies",
        );
      } finally {
        store.setIsLoadingSupportedCurrencies(false);
      }
    },
    [currencyService, store.isSupportedCurrenciesCacheExpired],
  );

  const convertCurrency = useCallback(
    async (amount: number, fromCurrency: string, toCurrency: string) => {
      try {
        return await currencyService.convertCurrency(
          amount,
          fromCurrency,
          toCurrency,
        );
      } catch (error) {
        console.error("Conversion failed", error);
        return null;
      }
    },
    [currencyService],
  );

  useEffect(() => {
    if (!store.isHydrated) return;
    if (autoFetchRates) fetchRates();
    if (autoFetchSupportedCurrencies) fetchSupportedCurrencies();
  }, [
    store.isHydrated,
    autoFetchRates,
    autoFetchSupportedCurrencies,
    fetchRates,
    fetchSupportedCurrencies,
  ]);

  return { ...store, fetchRates, fetchSupportedCurrencies, convertCurrency };
};
```
