# Currency Feature Documentation - Complete Guide

A comprehensive implementation guide for multi-currency support including real-time exchange rates, currency conversion, and caching strategies.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Environment Setup](#2-environment-setup)
3. [Project Structure](#3-project-structure)
4. [HTTP Client](#4-http-client)
5. [Currency Service](#5-currency-service)
6. [Currency Store (Zustand)](#6-currency-store-zustand)
7. [useCurrency Hook](#7-usecurrency-hook)
8. [Number Formatting](#8-number-formatting)
9. [Integration with Payments](#9-integration-with-payments)
10. [Best Practices](#10-best-practices)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CURRENCY SYSTEM FLOW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Component → useCurrency Hook → Currency Store (Zustand)                   │
│                     ↓                    ↓                                  │
│              Currency Service      Cached Rates (localStorage)             │
│                     ↓                                                       │
│              CurrencyFreaks API                                             │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        CACHING STRATEGY                             │   │
│   ├─────────────────────────────────────────────────────────────────────┤   │
│   │  • Exchange Rates: 15 minute cache                                  │   │
│   │  • Supported Currencies: 24 hour cache                              │   │
│   │  • Storage: localStorage via Zustand persist                        │   │
│   │  • Hydration: Wait for store rehydration before API calls           │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key Features:**

- Real-time exchange rates from CurrencyFreaks API
- Smart caching with configurable TTL
- Zustand state management with localStorage persistence
- Client-side hydration handling for SSR
- Supports 150+ fiat currencies and crypto

---

## 2. Environment Setup

### Required Environment Variable

```env
NEXT_PUBLIC_CURRENCY_API_KEY=your_currencyfreaks_api_key
```

Get your API key from: [CurrencyFreaks](https://currencyfreaks.com/)

### Dependencies

```bash
npm install zustand @untools/logger iso-country-currency
```

**Alternatives:**

- Replace `@untools/logger` with `console` if preferred
- `iso-country-currency` provides currency symbols by code

---

## 3. Project Structure

```
src/
├── utils/
│   ├── shared/
│   │   └── httpClient.ts       # Reusable HTTP client with retries
│   ├── currency/
│   │   └── currency.service.ts # CurrencyFreaks API wrapper
│   └── aevr/
│       └── number-formatter.ts # Currency & number formatting
├── store/
│   └── useCurrencyStore.ts     # Zustand store
└── hooks/
    └── useCurrency.ts          # React hook
```

---

## 4. HTTP Client

**File**: `utils/shared/httpClient.ts`

A robust fetch wrapper with retry logic, timeout handling, and type safety.

```typescript
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

export function isApiResponse<T>(
  response: unknown
): response is ApiResponse<T> {
  return (
    response !== null &&
    typeof response === "object" &&
    "data" in response &&
    "status" in response
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
    this.timeout = config.timeout || 30000;
    this.defaultHeaders = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...config.defaultHeaders,
    };
    this.retries = config.retries || 3;
    this.retryDelay = config.retryDelay || 1000;
  }

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

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    let lastError: HttpError | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const requestInit: RequestInit = {
          method,
          headers: requestHeaders,
          signal: controller.signal,
        };

        if (body && ["POST", "PUT", "PATCH"].includes(method)) {
          requestInit.body =
            typeof body === "string" ? body : JSON.stringify(body);
        }

        const response = await fetch(fullUrl, requestInit);
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text().catch(() => "Unknown error");
          throw this.createHttpError(
            `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            response.statusText,
            errorText
          );
        }

        const contentType = response.headers.get("content-type") || "";
        const data = contentType.includes("application/json")
          ? await response.json()
          : await response.text();

        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        return {
          data,
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
        } as ApiResponse<T>;
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error) {
          lastError =
            error.name === "AbortError"
              ? this.createHttpError(
                  `Request timeout after ${timeout}ms`,
                  408,
                  "Request Timeout"
                )
              : (error as HttpError);
        } else {
          lastError = this.createHttpError("Unknown error occurred");
        }

        // Don't retry on client errors
        if (
          lastError.status &&
          [400, 401, 403, 404, 422].includes(lastError.status)
        ) {
          break;
        }

        if (attempt < retries) {
          const delay = this.retryDelay * Math.pow(2, attempt); // Exponential backoff
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }
}
```

---

## 5. Currency Service

**File**: `utils/currency/currency.service.ts`

Wraps the CurrencyFreaks API for fetching rates and converting currencies.

```typescript
import { HttpClient, isApiResponse } from "@/utils/shared/httpClient";

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

export class CurrencyService {
  private httpClient: HttpClient;
  private apiKey: string;
  private readonly baseUrl = "https://api.currencyfreaks.com/v2.0";

  constructor(httpClient: HttpClient, apiKey: string) {
    this.httpClient = httpClient;
    this.apiKey = apiKey;
  }

  /**
   * Fetch latest exchange rates.
   * @param symbols Comma-separated list of currency codes (optional)
   * @param base Base currency (default: USD)
   */
  async getLatestRates(
    symbols?: string,
    base: string = "USD"
  ): Promise<CurrencyRatesResponse> {
    const params = new URLSearchParams({
      apikey: this.apiKey,
      ...(symbols && { symbols }),
      ...(base !== "USD" && { base }),
    });

    const response = await this.httpClient.makeRequest<CurrencyRatesResponse>(
      `${this.baseUrl}/rates/latest?${params.toString()}`,
      { method: "GET" }
    );

    return isApiResponse(response) ? response.data : response;
  }

  /**
   * Fetch all supported currencies.
   */
  async getSupportedCurrencies(): Promise<SupportedCurrenciesResponse> {
    const response =
      await this.httpClient.makeRequest<SupportedCurrenciesResponse>(
        `${this.baseUrl}/supported-currencies`,
        { method: "GET" }
      );

    return isApiResponse(response) ? response.data : response;
  }

  /**
   * Convert amount from one currency to another.
   * Fetches fresh rates for accuracy.
   */
  async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<number> {
    if (fromCurrency === toCurrency) return amount;

    const rates = await this.getLatestRates(`${fromCurrency},${toCurrency}`);

    let convertedAmount: number;

    if (fromCurrency === rates.base) {
      // From base currency
      const targetRate = parseFloat(rates.rates[toCurrency]);
      convertedAmount = amount * targetRate;
    } else if (toCurrency === rates.base) {
      // To base currency
      const sourceRate = parseFloat(rates.rates[fromCurrency]);
      convertedAmount = amount / sourceRate;
    } else {
      // Cross-rate conversion via base
      const sourceRate = parseFloat(rates.rates[fromCurrency]);
      const targetRate = parseFloat(rates.rates[toCurrency]);
      convertedAmount = (amount / sourceRate) * targetRate;
    }

    return Math.round(convertedAmount * 100) / 100;
  }
}

export const createCurrencyService = (
  httpClient: HttpClient,
  apiKey: string
): CurrencyService => {
  return new CurrencyService(httpClient, apiKey);
};
```

---

## 6. Currency Store (Zustand)

**File**: `store/useCurrencyStore.ts`

Global state with persistence and cache management.

```typescript
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  CurrencyRatesResponse,
  SupportedCurrency,
} from "@/utils/currency/currency.service";

export interface CurrencyStoreState {
  // Data
  rates: CurrencyRatesResponse | null;
  supportedCurrencies: { [currencyCode: string]: SupportedCurrency };

  // Loading states
  isLoadingRates: boolean;
  isLoadingSupportedCurrencies: boolean;

  // Errors
  ratesError: string | null;
  supportedCurrenciesError: string | null;

  // Cache timestamps
  lastRatesUpdate: number | null;
  lastSupportedCurrenciesUpdate: number | null;
  ratesCacheDuration: number;
  supportedCurrenciesCacheDuration: number;

  // User preferences
  baseCurrency: string;
  favoriteCurrencies: string[];

  // Hydration flag
  isHydrated: boolean;

  // Actions
  setRates: (rates: CurrencyRatesResponse) => void;
  setSupportedCurrencies: (currencies: {
    [code: string]: SupportedCurrency;
  }) => void;
  setIsLoadingRates: (loading: boolean) => void;
  setIsLoadingSupportedCurrencies: (loading: boolean) => void;
  setRatesError: (error: string | null) => void;
  setSupportedCurrenciesError: (error: string | null) => void;
  setBaseCurrency: (currency: string) => void;
  addFavoriteCurrency: (currency: string) => void;
  removeFavoriteCurrency: (currency: string) => void;
  isRatesCacheExpired: () => boolean;
  isSupportedCurrenciesCacheExpired: () => boolean;
  getCurrencyRate: (code: string) => string | null;
  getPopularCurrencies: () => SupportedCurrency[];
  reset: () => void;
  setIsHydrated: (isHydrated: boolean) => void;
}

const useCurrencyStore = create<CurrencyStoreState>()(
  persist(
    (set, get) => ({
      // Initial state
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
      isHydrated: false,

      // Actions
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
        if (!favoriteCurrencies.includes(currency)) {
          set({ favoriteCurrencies: [...favoriteCurrencies, currency] });
        }
      },

      removeFavoriteCurrency: (currency) => {
        const { favoriteCurrencies } = get();
        set({
          favoriteCurrencies: favoriteCurrencies.filter((c) => c !== currency),
        });
      },

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

      getCurrencyRate: (code) => get().rates?.rates[code] || null,

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

      setIsHydrated: (isHydrated) => set({ isHydrated }),
    }),
    {
      name: "currencyStore",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        rates: state.rates,
        supportedCurrencies: state.supportedCurrencies,
        lastRatesUpdate: state.lastRatesUpdate,
        lastSupportedCurrenciesUpdate: state.lastSupportedCurrenciesUpdate,
        baseCurrency: state.baseCurrency,
        favoriteCurrencies: state.favoriteCurrencies,
        ratesCacheDuration: state.ratesCacheDuration,
        supportedCurrenciesCacheDuration:
          state.supportedCurrenciesCacheDuration,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setIsHydrated(true);
      },
    }
  )
);

export default useCurrencyStore;
```

---

## 7. useCurrency Hook

**File**: `hooks/useCurrency.ts`

React hook that connects components to the currency system.

```typescript
import { useCallback, useEffect, useMemo } from "react";
import { HttpClient } from "@/utils/shared/httpClient";
import { createCurrencyService } from "@/utils/currency/currency.service";
import useCurrencyStore from "@/store/useCurrencyStore";

interface UseCurrencyConfig {
  httpClient?: HttpClient;
  apiKey?: string;
  autoFetchRates?: boolean;
  autoFetchSupportedCurrencies?: boolean;
}

const DEFAULT_HTTP_CLIENT = new HttpClient({
  baseUrl: "https://api.currencyfreaks.com",
});

export const useCurrency = (config: UseCurrencyConfig = {}) => {
  const {
    httpClient = DEFAULT_HTTP_CLIENT,
    apiKey = process.env.NEXT_PUBLIC_CURRENCY_API_KEY || "",
    autoFetchRates = true,
    autoFetchSupportedCurrencies = true,
  } = config;

  const store = useCurrencyStore();

  const {
    ratesError,
    supportedCurrenciesError,
    isRatesCacheExpired,
    isSupportedCurrenciesCacheExpired,
    setIsLoadingRates,
    setRates,
    setRatesError,
    setIsLoadingSupportedCurrencies,
    setSupportedCurrencies,
    setSupportedCurrenciesError,
    isHydrated,
  } = store;

  // Stable service instance
  const currencyService = useMemo(
    () => createCurrencyService(httpClient, apiKey),
    [httpClient, apiKey]
  );

  const fetchRates = useCallback(
    async (symbols?: string, forceRefresh = false) => {
      if (!forceRefresh && !isRatesCacheExpired()) return;
      setIsLoadingRates(true);
      setRatesError(null);
      try {
        const ratesData = await currencyService.getLatestRates(symbols);
        setRates(ratesData);
      } catch (error) {
        setRatesError(
          error instanceof Error ? error.message : "Failed to fetch rates"
        );
      } finally {
        setIsLoadingRates(false);
      }
    },
    [
      currencyService,
      isRatesCacheExpired,
      setIsLoadingRates,
      setRates,
      setRatesError,
    ]
  );

  const fetchSupportedCurrencies = useCallback(
    async (forceRefresh = false) => {
      if (!forceRefresh && !isSupportedCurrenciesCacheExpired()) return;
      setIsLoadingSupportedCurrencies(true);
      setSupportedCurrenciesError(null);
      try {
        const data = await currencyService.getSupportedCurrencies();
        setSupportedCurrencies(data.supportedCurrenciesMap);
      } catch (error) {
        setSupportedCurrenciesError(
          error instanceof Error ? error.message : "Failed to fetch currencies"
        );
      } finally {
        setIsLoadingSupportedCurrencies(false);
      }
    },
    [
      currencyService,
      isSupportedCurrenciesCacheExpired,
      setIsLoadingSupportedCurrencies,
      setSupportedCurrencies,
      setSupportedCurrenciesError,
    ]
  );

  const convertCurrency = useCallback(
    async (amount: number, fromCurrency: string, toCurrency: string) => {
      try {
        return await currencyService.convertCurrency(
          amount,
          fromCurrency,
          toCurrency
        );
      } catch (error) {
        console.error("Conversion failed", error);
        return null;
      }
    },
    [currencyService]
  );

  // Auto-fetch on mount (after hydration)
  useEffect(() => {
    if (!isHydrated) return;

    if (autoFetchSupportedCurrencies && !supportedCurrenciesError) {
      fetchSupportedCurrencies();
    }

    if (autoFetchRates && !ratesError) {
      fetchRates();
    }
  }, [
    isHydrated,
    autoFetchRates,
    autoFetchSupportedCurrencies,
    fetchRates,
    fetchSupportedCurrencies,
    ratesError,
    supportedCurrenciesError,
  ]);

  return {
    ...store,
    fetchRates,
    fetchSupportedCurrencies,
    convertCurrency,
  };
};
```

---

## 8. Number Formatting

**File**: `utils/aevr/number-formatter.ts`

```typescript
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
  options: FormatCurrencyOptions = {}
): string {
  const {
    currency = "USD",
    locale = "en-US",
    minimumFractionDigits: minFD = 2,
    maximumFractionDigits: maxFD = 5,
    display = "symbol",
    symbolFirst = true,
  } = options;

  let minimumFractionDigits = Math.max(0, minFD);
  let maximumFractionDigits = Math.max(0, maxFD);

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
        if (foundSymbol) symbol = foundSymbol;
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
        return symbol
          ? symbolFirst
            ? `${symbol} ${formattedNumber} (${currency})`
            : `${currency} ${formattedNumber} (${symbol})`
          : `${currency} ${formattedNumber}`;
      case "code":
      default:
        return `${currency} ${formattedNumber}`;
    }
  } catch (error) {
    console.error("Error formatting currency:", error);
    return `${currency} ${(value || 0).toFixed(minimumFractionDigits)}`;
  }
}
```

### Usage Examples

```typescript
formatCurrency(1234.56, { currency: "USD" }); // "$1,234.56"
formatCurrency(1234.56, { currency: "NGN" }); // "₦1,234.56"
formatCurrency(1234.56, { currency: "EUR", display: "code" }); // "EUR 1,234.56"
formatCurrency(1234.56, { currency: "GBP", display: "both" }); // "£ 1,234.56 (GBP)"
```

---

## 9. Integration with Payments

### Dynamic Pricing Example

```typescript
// In credits page
const { baseCurrency, setBaseCurrency, rates, convertCurrency } = useCurrency();

const [inputAmount, setInputAmount] = useState(1);
const [calculatedCredits, setCalculatedCredits] = useState(80);

// Effect to calculate credits when amount/currency changes
useEffect(() => {
  const calc = async () => {
    if (!rates) return;

    // Convert user's input to USD
    const usdValue = await convertCurrency(inputAmount, baseCurrency, "USD");
    if (usdValue === null) return;

    // 1 USD = 80 Credits
    const credits = Math.floor(usdValue * 80);
    setCalculatedCredits(credits);
  };

  calc();
}, [inputAmount, baseCurrency, rates, convertCurrency]);
```

### Currency Selector Component

```tsx
const CurrencySelector = () => {
  const { baseCurrency, setBaseCurrency, supportedCurrencies } = useCurrency();
  const currencyCodes = Object.keys(supportedCurrencies).sort();

  return (
    <select
      value={baseCurrency}
      onChange={(e) => setBaseCurrency(e.target.value)}
    >
      {currencyCodes.map((code) => (
        <option key={code} value={code}>
          {code} - {supportedCurrencies[code]?.currencyName}
        </option>
      ))}
    </select>
  );
};
```

---

## 10. Best Practices

### 1. Hydration Handling

Always wait for store hydration before making API calls:

```typescript
useEffect(() => {
  if (!isHydrated) return; // Wait for localStorage rehydration
  fetchRates();
}, [isHydrated]);
```

### 2. Cache Management

- **Rates**: 15-minute cache is optimal for real-time accuracy
- **Supported Currencies**: 24-hour cache (rarely changes)
- Use `forceRefresh` parameter when user explicitly requests update

### 3. Error Handling

```typescript
const { ratesError, fetchRates } = useCurrency();

if (ratesError) {
  return (
    <div>
      <p>Failed to load rates: {ratesError}</p>
      <button onClick={() => fetchRates(undefined, true)}>Retry</button>
    </div>
  );
}
```

### 4. Loading States

```typescript
const { isLoadingRates } = useCurrency();

return (
  <div>
    {isLoadingRates && <Spinner />}
    <CurrencyDisplay />
  </div>
);
```

### 5. SSR Considerations

- Store is only populated after client-side hydration
- Use fallback values for server render
- Avoid accessing `localStorage` during SSR

### 6. API Rate Limiting

CurrencyFreaks has rate limits. The caching strategy helps:

- Don't fetch on every component mount
- Use `isRatesCacheExpired()` check
- Batch currency requests where possible

---

## Quick Reference

| Function/Hook                       | Purpose                            |
| ----------------------------------- | ---------------------------------- |
| `useCurrency()`                     | Main hook for currency operations  |
| `convertCurrency(amount, from, to)` | Convert between currencies         |
| `formatCurrency(value, options)`    | Format number with currency symbol |
| `fetchRates(symbols?, force?)`      | Refresh exchange rates             |
| `setBaseCurrency(code)`             | Change user's base currency        |
| `isRatesCacheExpired()`             | Check if rates need refresh        |

| Store Property        | Purpose                                    |
| --------------------- | ------------------------------------------ |
| `rates`               | Current exchange rates object              |
| `supportedCurrencies` | Map of all available currencies            |
| `baseCurrency`        | User's preferred base currency             |
| `isLoadingRates`      | Loading state for rates                    |
| `isHydrated`          | Whether store has loaded from localStorage |
