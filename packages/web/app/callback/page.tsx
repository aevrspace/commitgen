"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("Verifying payment...");

  const reference = searchParams.get("reference") || searchParams.get("trxref");

  const verifyPayment = useCallback(async () => {
    if (!reference) {
      return;
    }

    try {
      const res = await fetch(`/api/payment/status?reference=${reference}`);
      const data = await res.json();

      if (data.status === "successful") {
        setStatus("success");
        setMessage("Payment successful! Redirecting...");
        setTimeout(() => {
          router.push("/credits?payment=success");
        }, 1500);
      } else if (data.status === "pending") {
        setMessage("Payment is being processed. This may take a moment...");
        setTimeout(verifyPayment, 3000);
      } else {
        setStatus("error");
        setMessage(data.error || "Payment verification failed");
      }
    } catch (error) {
      console.error("Verification error:", error);
      setStatus("error");
      setMessage(
        "Failed to verify payment. Please check your transaction history."
      );
    }
  }, [reference, router]);

  useEffect(() => {
    if (!reference) {
      setStatus("error");
      setMessage("No payment reference found");
      return;
    }

    verifyPayment();
  }, [reference, verifyPayment]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6 p-6">
      <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 text-center">
        {status === "loading" && (
          <>
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-neutral-200 border-t-indigo-600 dark:border-neutral-700 dark:border-t-indigo-400" />
            <h2 className="text-xl font-semibold mb-2">Processing Payment</h2>
            <p className="text-neutral-500">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-8 w-8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-green-600 dark:text-green-400">
              Payment Successful!
            </h2>
            <p className="text-neutral-500">{message}</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-8 w-8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-red-600 dark:text-red-400">
              Payment Issue
            </h2>
            <p className="text-neutral-500 mb-4">{message}</p>
            <button
              onClick={() => router.push("/credits")}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              Go to Credits
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[80vh]">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-200 border-t-indigo-600" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
