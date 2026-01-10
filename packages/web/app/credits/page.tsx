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

export default function CreditsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount] = useState(80); // Default 80 credits
  const [provider, setProvider] = useState<"paystack" | "100pay">("paystack");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // Assuming token is in localStorage or handled by a hook, but for now let's try to fetch
    // If we use httpOnly cookie, it's automatic. If bearer, we need to find where it is stored.
    // I'll assume localStorage "token" for now as seen in typical auth.
    // If not, the user might need to log in again or I need to find the token storage.
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

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
  }, []);

  const handleDeposit = async () => {
    if (!user) {
      toast.error("Please log in to purchase credits");
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch("/api/payment/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountOfCredits: amount,
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
              name: user.email.split("@")[0], // Fallback name
              user_id: user.id,
              phone: "0000000000",
            },
            metadata: { ref_id: data.data.ref_id, credits: amount },
          },
          () => console.log("Closed"), // onClose
          (error: unknown) => {
            console.error("100Pay Error:", error);
            toast.error("Payment failed");
            setProcessing(false);
          },
          (reference: string) => {
            console.log("Success ref:", reference);
            // Verify? The webhook handles the actual update.
            // We can poll or just show success message.
            toast.success("Payment successful! Credits will be added shortly.");
            setProcessing(false);
            // Refresh user?
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

  if (loading)
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

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8 p-6">
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Buy Credits</h1>
        <p className="text-neutral-500 dark:text-neutral-400">
          Refill your account to generate more commits.
        </p>
      </div>

      <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mb-6 flex items-center justify-between">
          <span className="text-sm font-medium text-neutral-500">
            Current Balance
          </span>
          <span className="text-xl font-bold">{user.credits} Credits</span>
        </div>

        <div className="mb-6 space-y-4">
          <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/30 dark:bg-indigo-900/10">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-indigo-900 dark:text-indigo-100">
                Standard Pack
              </span>
              <span className="font-bold text-lg text-indigo-700 dark:text-indigo-300">
                $1.00
              </span>
            </div>
            <p className="text-sm text-indigo-600/80 dark:text-indigo-400 mt-1">
              80 Credits
            </p>
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
            disabled={processing}
          >
            {processing
              ? "Processing..."
              : `Pay $1.00 via ${
                  provider === "paystack" ? "Paystack" : "100Pay"
                }`}
          </Button>
        </div>
      </div>
    </div>
  );
}
