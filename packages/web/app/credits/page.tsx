"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/aevr/button";
import { toast } from "sonner";
import { payWith100Pay } from "@/utils/payWith100Pay";
import { TransactionHistory } from "@/components/transactions/TransactionHistory";
import { TransactionReceipt } from "@/components/transactions/TransactionReceipt";
import { ArrowSwapHorizontal } from "iconsax-react";

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

  const supportedCurrencyCodes = Object.keys(supportedCurrencies).sort();

  // Input mode: "amount" (default) or "credits"
  const [inputMode, setInputMode] = useState<"amount" | "credits">("credits");
  const [inputAmount, setInputAmount] = useState<number>(1); // Fiat amount when mode=amount
  const [inputCredits, setInputCredits] = useState<number>(100); // Credits when mode=credits
  const [calculatedCredits, setCalculatedCredits] = useState<number>(100);
  const [calculatedAmount, setCalculatedAmount] = useState<number>(0);
  const [creditCostInUsd, setCreditCostInUsd] = useState(1);
  const [creditsPerUsd, setCreditsPerUsd] = useState(80); // Dynamic from API

  // Fetch dynamic credits per USD from platform settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          setCreditsPerUsd(data.creditsPerUsd || 80);
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      }
    };
    fetchSettings();
  }, []);

  // Effect to calculate based on input mode
  useEffect(() => {
    const calc = async () => {
      if (!rates) return;

      if (inputMode === "amount") {
        // Convert User's Input (in baseCurrency) -> USD
        const usdValue = await convertCurrency(
          inputAmount,
          baseCurrency,
          "USD"
        );
        if (usdValue === null) return;

        setCreditCostInUsd(usdValue);
        // Use dynamic credits per USD
        const credits = Math.floor(usdValue * creditsPerUsd);
        setCalculatedCredits(credits);
      } else {
        // Credits mode: calculate amount from credits
        // Use dynamic credits per USD
        const usdValue = inputCredits / creditsPerUsd;
        setCreditCostInUsd(usdValue);
        setCalculatedCredits(inputCredits);

        // Convert USD -> baseCurrency
        const amountInCurrency = await convertCurrency(
          usdValue,
          "USD",
          baseCurrency
        );
        if (amountInCurrency !== null) {
          setCalculatedAmount(amountInCurrency);
        }
      }
    };
    calc();
  }, [
    inputAmount,
    inputCredits,
    inputMode,
    baseCurrency,
    rates,
    convertCurrency,
    creditsPerUsd,
  ]);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<{
    amount: number;
    credits: number;
    reference: string;
  } | null>(null);

  // ... existing useEffects

  // Custom Success Handler
  const handlePaymentSuccess = (
    amount: number,
    credits: number,
    ref: string
  ) => {
    setLastTransaction({ amount, credits, reference: ref });
    setShowSuccessModal(true);
    // Trigger user refresh?
  };

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
          amountOfCredits: calculatedCredits,
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
          // Should we save pending state locally to show success on return?
          // For now, simple redirect
          window.location.href = data.authorizationUrl;
        }
      } else {
        // 100Pay
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
          (reference: string) => {
            setProcessing(false); // Immediate stop
            // Show success modal details
            handlePaymentSuccess(
              data.data.amount,
              calculatedCredits,
              reference
            );
            toast.success("Payment successful!");
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

  // ... loading/auth checks

  if (!isHydrated || loading)
    return <div className="p-10 flex justify-center">Loading...</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8 p-6 max-w-5xl mx-auto w-full">
      {/* Top Section: Buy Credits */}
      <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left: Input */}
        <div className="flex flex-col gap-8">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tight">Buy Credits</h1>
            <p className="text-neutral-500 dark:text-neutral-400">
              {inputMode === "credits"
                ? "Enter the credits you want and see the price."
                : "Enter an amount to calculate how many credits you'll get."}
            </p>
          </div>

          <div className="w-full rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
            <div className="mb-6 space-y-4">
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
                <div className="flex flex-col gap-4">
                  {/* Input Section */}
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="text-xs font-semibold uppercase text-neutral-500 mb-1 block">
                        {inputMode === "credits" ? "Credits" : "Amount"}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          value={
                            inputMode === "credits" ? inputCredits : inputAmount
                          }
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            if (inputMode === "credits") {
                              setInputCredits(val);
                            } else {
                              setInputAmount(val);
                            }
                          }}
                          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-lg font-semibold focus:border-indigo-500 focus:outline-none dark:border-neutral-700 dark:bg-black"
                        />
                        {isLoadingRates && (
                          <div className="absolute right-2 top-3 text-[10px] text-neutral-400">
                            Updating...
                          </div>
                        )}
                      </div>
                    </div>
                    {inputMode === "amount" && (
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
                    )}
                  </div>

                  {/* Toggle Button */}
                  <div className="flex justify-center">
                    <button
                      onClick={() =>
                        setInputMode(
                          inputMode === "credits" ? "amount" : "credits"
                        )
                      }
                      className="flex items-center gap-2 rounded-full bg-neutral-200 px-4 py-2 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
                    >
                      <ArrowSwapHorizontal
                        variant="Bulk"
                        color="currentColor"
                        className="h-4 w-4"
                      />
                      Switch to {inputMode === "credits" ? "Amount" : "Credits"}{" "}
                      input
                    </button>
                  </div>

                  {/* Result Section */}
                  <div className="flex items-center justify-between border-t border-neutral-200 pt-4 dark:border-neutral-800">
                    <div className="text-sm text-neutral-500">
                      {inputMode === "credits"
                        ? `You Pay (${baseCurrency})`
                        : "You Get"}
                    </div>
                    <div className="text-right">
                      {inputMode === "credits" ? (
                        <>
                          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                            {formatCurrency(calculatedAmount, {
                              currency: baseCurrency,
                            })}
                          </div>
                          <div className="text-xs text-neutral-400">
                            (approx{" "}
                            {formatCurrency(creditCostInUsd, {
                              currency: "USD",
                            })}
                            )
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                            {calculatedCredits.toLocaleString()} Credits
                          </div>
                          <div className="text-xs text-neutral-400">
                            (approx{" "}
                            {formatCurrency(creditCostInUsd, {
                              currency: "USD",
                            })}
                            )
                          </div>
                        </>
                      )}
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
              <label className="text-sm font-medium leading-none">
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
                  : `Pay via ${
                      provider === "paystack" ? "Paystack" : "100Pay"
                    }`}
              </Button>
            </div>
          </div>
        </div>

        {/* Right: History */}
        <div className="w-full">
          <TransactionHistory />
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && lastTransaction && (
        <TransactionReceipt
          transaction={{
            id: lastTransaction.reference,
            amount: lastTransaction.amount,
            credits: lastTransaction.credits,
            currency: "NGN",
            status: "successful",
            category: "deposit",
            channel: provider,
            providerReference: lastTransaction.reference,
            createdAt: new Date().toISOString(),
          }}
          onClose={() => setShowSuccessModal(false)}
          showSuccessHeader={true}
        />
      )}
    </div>
  );
}
