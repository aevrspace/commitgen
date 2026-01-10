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
    return `${currency} ${(value || 0).toFixed(
      Math.max(0, minimumFractionDigits)
    )}`;
  }
}
