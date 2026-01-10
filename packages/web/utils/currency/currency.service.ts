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
    base: string = "USD"
  ): Promise<CurrencyRatesResponse> {
    try {
      const params = new URLSearchParams({
        apikey: this.apiKey,
        ...(symbols && { symbols }),
        // Free plan only supports USD base. We ignore the 'base' argument.
      });
      logger?.info(`Fetching currency rates for symbols: ${symbols || "all"}`);
      const response = await this.httpClient.makeRequest<CurrencyRatesResponse>(
        `${this.baseUrl}/rates/latest?${params.toString()}`,
        { method: "GET" }
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
          { method: "GET" }
        );

      let data: SupportedCurrenciesResponse;
      if (isApiResponse(response)) {
        data = response.data;
      } else {
        data = response as SupportedCurrenciesResponse;
      }

      // Restrict to Top 10 Fiat + 5 Crypto
      const WHITELIST = [
        "USD",
        "EUR",
        "GBP",
        "JPY",
        "AUD",
        "CAD",
        "CHF",
        "CNY",
        "INR",
        "NGN", // Fiat
        "BTC",
        "ETH",
        "USDT",
        "BNB",
        "SOL", // Crypto
      ];

      const filteredMap: { [key: string]: SupportedCurrency } = {};

      // Handle if data has 'supportedCurrenciesMap' property OR if data IS the map
      // We cast to any to safe check properties
      const rawMap = data.supportedCurrenciesMap || data;

      if (rawMap) {
        WHITELIST.forEach((code) => {
          // Check if the code exists in the map
          if (rawMap[code]) {
            filteredMap[code] = rawMap[code];
          }
        });
        // Always return in the expected interface format
        return { supportedCurrenciesMap: filteredMap };
      }

      return data;
    } catch (error) {
      logger?.error(`Failed to fetch supported currencies:`, error);
      throw error;
    }
  }

  async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
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
  apiKey: string
): CurrencyService => {
  return new CurrencyService({ httpClient, apiKey });
};
