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

export const useCurrency = (config: UseCurrencyConfig = {}) => {
  const {
    httpClient = DEFAULT_HTTP_CLIENT,
    apiKey = process.env.NEXT_PUBLIC_CURRENCY_API_KEY || "",
    autoFetchRates = true,
    autoFetchSupportedCurrencies = true,
  } = config;

  const store = useCurrencyStore();

  // Stable service instance
  const currencyService = useMemo(
    () => createCurrencyService(httpClient, apiKey),
    [httpClient, apiKey]
  );

  const fetchRates = useCallback(
    async (symbols?: string, forceRefresh = false) => {
      if (!forceRefresh && !store.isRatesCacheExpired()) return;
      store.setIsLoadingRates(true);
      store.setRatesError(null);
      try {
        const ratesData = await currencyService.getLatestRates(
          symbols,
          store.baseCurrency
        );
        store.setRates(ratesData);
      } catch (error) {
        store.setRatesError(
          error instanceof Error ? error.message : "Failed to fetch rates"
        );
      } finally {
        store.setIsLoadingRates(false);
      }
    },
    [
      currencyService,
      store.baseCurrency,
      store.isRatesCacheExpired,
      store.setIsLoadingRates,
      store.setRates,
      store.setRatesError,
    ]
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
          error instanceof Error ? error.message : "Failed to fetch currencies"
        );
      } finally {
        store.setIsLoadingSupportedCurrencies(false);
      }
    },
    [
      currencyService,
      store.isSupportedCurrenciesCacheExpired,
      store.setIsLoadingSupportedCurrencies,
      store.setSupportedCurrencies,
      store.setSupportedCurrenciesError,
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

  useEffect(() => {
    if (!store.isHydrated) return;

    if (autoFetchSupportedCurrencies && !store.supportedCurrenciesError) {
      fetchSupportedCurrencies();
    }

    if (autoFetchRates && !store.ratesError) {
      fetchRates();
    }
  }, [
    store.isHydrated,
    autoFetchRates,
    autoFetchSupportedCurrencies,
    fetchRates,
    fetchSupportedCurrencies,
    store.ratesError,
    store.supportedCurrenciesError,
  ]);

  return {
    ...store,
    fetchRates,
    fetchSupportedCurrencies,
    convertCurrency,
  };
};
