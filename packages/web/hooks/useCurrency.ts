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

  const {
    baseCurrency,
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
  } = useCurrencyStore();

  const store = useCurrencyStore();

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
