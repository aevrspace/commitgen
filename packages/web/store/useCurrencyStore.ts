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
      name: "currencyStore-v2",
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
    }
  )
);

export default useCurrencyStore;
