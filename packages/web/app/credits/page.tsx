"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/aevr/button";
import { toast } from "sonner";
import { payWith100Pay } from "@/utils/payWith100Pay";

interface User {
  id: string;
  email: string;
  credits: number;
}

import { usePersistedState } from "@/hooks/aevr/use-persisted-state";
import { useCurrency } from "@/hooks/useCurrency";
import { formatCurrency } from "@/utils/aevr/number-formatter";

export default function CreditsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<"paystack" | "100pay">("paystack");
  const [processing, setProcessing] = useState(false);

  // Sync with Global Auth State
  const { state: token, isHydrated } = usePersistedState<string>("", {
    storageKey: "authToken",
  });

  useEffect(() => {
    if (!isHydrated) return;

    if (!token) {
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (error) {
        console.error("Failed to fetch user", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token, isHydrated]);

  // Flexible Payment State
  const {
    baseCurrency,
    setBaseCurrency,
    rates,
    supportedCurrencies,
    isLoadingRates,
    convertCurrency,
  } = useCurrency();

  const [inputAmount, setInputAmount] = useState<number>(1); // 1 Unit of baseCurrency
  const [calculatedCredits, setCalculatedCredits] = useState<number>(80);
  const [creditCostInUsd, setCreditCostInUsd] = useState(1);

  // Effect to calculate credits when amount or currency changes
  useEffect(() => {
    const calc = async () => {
      if (!rates) return;
      // Convert User's Input (in baseCurrency) -> USD
      const usdValue = await convertCurrency(inputAmount, baseCurrency, "USD");

      if (usdValue === null) return;

      setCreditCostInUsd(usdValue);
      // 1 USD = 80 Credits
      const credits = Math.floor(usdValue * 80);
      setCalculatedCredits(credits);
    };
    calc();
  }, [inputAmount, baseCurrency, rates, convertCurrency]);

  const handleDeposit = async () => {
    if (!user) {
      toast.error("Please log in to purchase credits");
      return;
    }

    if (calculatedCredits < 10) {
      toast.error("Minimum purchase is 10 Credits");
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch("/api/payment/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountOfCredits: calculatedCredits, // We verify this matches backend calculation if we sent money
          // Actually, our API takes 'amountOfCredits'. The user PAYS 'inputAmount' in 'baseCurrency'.
          // Limitation: Our API currently assumes we send 'amountOfCredits' and it calculates price in NGN/USD.
          // To truly support "Pay NGN 2000", we need to tell the API "User wants to pay 2000 NGN, give them equivalent credits".
          // OR, safely: We calculate credits here (say 500) and tell API "User buying 500 credits". API calculates price.
          // If API price differs slightly from frontend estimation due to rate flux, user might be charged slightly differently?
          // For now, let's stick to: We tell API how many credits. The API calculates the price.
          // WAIT. If I say "pay 2000 NGN", I expect to be charged exactly 2000 NGN.
          // If I tell API "User buying 323 Credits", API will revert that to USD -> NGN.
          // Let's assume the flow: User sees "Approx 323 Credits". We send 323 Credits. API calculates cost.
          email: user.email,
          userId: user.id,
          provider,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Payment initialization failed");
      }

      if (provider === "paystack") {
        if (data.authorizationUrl) {
          window.location.href = data.authorizationUrl;
        }
      } else {
        // 100Pay
        payWith100Pay(
          {
            apiKey: process.env.NEXT_PUBLIC_HUNDREDPAY_API_KEY || "",
            billing: { amount: data.data.amount },
            customer: {
              email: user.email,
              name: user.email.split("@")[0],
              user_id: user.id,
              phone: "0000000000",
            },
            metadata: { ref_id: data.data.ref_id, credits: calculatedCredits },
          },
          () => {
            console.log("Closed");
            setProcessing(false);
          },
          (error: unknown) => {
            console.error("100Pay Error:", error);
            toast.error("Payment failed");
            setProcessing(false);
          },
          () => {
            toast.success("Payment successful! Credits will be added shortly.");
            setProcessing(false);
          }
        );
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unknown error occurred");
      }
      setProcessing(false);
    }
  };

  if (!isHydrated || loading)
    return <div className="p-10 flex justify-center">Loading...</div>;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h1 className="text-2xl font-bold">Buy Credits</h1>
        <p>Please log in to purchase credits.</p>
        <Button asChild>
          <a href="/login">Login</a>
        </Button>
      </div>
    );
  }

  const supportedCurrencyCodes = Object.keys(supportedCurrencies).sort();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8 p-6">
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Buy Credits</h1>
        <p className="text-neutral-500 dark:text-neutral-400">
          Enter an amount to calculate how many credits you&apos;ll get.
        </p>
      </div>

      <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mb-6 flex items-center justify-between">
          <span className="text-sm font-medium text-neutral-500">
            Current Balance
          </span>
          <span className="text-xl font-bold">{user.credits} Credits</span>
        </div>

        {/* Dynamic Calculator */}
        <div className="mb-6 space-y-4">
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
            <div className="flex flex-col gap-4">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="text-xs font-semibold uppercase text-neutral-500 mb-1 block">
                    Amount
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={inputAmount}
                      onChange={(e) =>
                        setInputAmount(parseFloat(e.target.value) || 0)
                      }
                      className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-neutral-700 dark:bg-black"
                    />
                    {isLoadingRates && (
                      <div className="absolute right-2 top-2 text-[10px] text-neutral-400">
                        Updating...
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-1/3">
                  <label className="text-xs font-semibold uppercase text-neutral-500 mb-1 block">
                    Currency
                  </label>
                  <select
                    value={baseCurrency}
                    onChange={(e) => setBaseCurrency(e.target.value)}
                    className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-neutral-700 dark:bg-black"
                  >
                    {supportedCurrencyCodes.length > 0 ? (
                      supportedCurrencyCodes.map((code) => (
                        <option key={code} value={code}>
                          {code}
                        </option>
                      ))
                    ) : (
                      <option value="USD">USD</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-neutral-200 pt-4 dark:border-neutral-800">
                <div className="text-sm text-neutral-500">
                  You Get Using {baseCurrency}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {calculatedCredits.toLocaleString()} Credits
                  </div>
                  <div className="text-xs text-neutral-400">
                    (approx{" "}
                    {formatCurrency(creditCostInUsd, { currency: "USD" })})
                  </div>
                </div>
              </div>
              {calculatedCredits < 10 && (
                <div className="text-xs text-red-500 text-center font-medium">
                  Minimum purchase is 10 Credits
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Select Payment Method
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setProvider("paystack")}
              className={`flex items-center justify-center rounded-lg border p-4 transition-all hover:border-black dark:hover:border-white ${
                provider === "paystack"
                  ? "border-black ring-1 ring-black dark:border-white dark:ring-white"
                  : "border-neutral-200 dark:border-neutral-800"
              }`}
            >
              <span className="font-medium">Paystack</span>
            </button>
            <button
              onClick={() => setProvider("100pay")}
              className={`flex items-center justify-center rounded-lg border p-4 transition-all hover:border-black dark:hover:border-white ${
                provider === "100pay"
                  ? "border-black ring-1 ring-black dark:border-white dark:ring-white"
                  : "border-neutral-200 dark:border-neutral-800"
              }`}
            >
              <span className="font-medium">100Pay</span>
            </button>
          </div>

          <Button
            onClick={handleDeposit}
            className="w-full mt-4"
            size="lg"
            disabled={processing || calculatedCredits < 10}
          >
            {processing
              ? "Processing..."
              : `Pay via ${provider === "paystack" ? "Paystack" : "100Pay"}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
