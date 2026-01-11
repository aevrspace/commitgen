"use client";

import React from "react";
import { format } from "date-fns";
import { formatCurrency } from "@/utils/aevr/number-formatter";

export interface TransactionReceiptData {
  id: string;
  amount: number;
  credits: number;
  currency?: string;
  status: string;
  category?: string;
  channel?: string;
  providerReference?: string;
  createdAt: string;
  customer?: {
    email?: string;
    name?: string;
  };
}

interface TransactionReceiptProps {
  transaction: TransactionReceiptData;
  onClose: () => void;
  showSuccessHeader?: boolean;
}

// Generate a more realistic barcode pattern from reference ID
function Barcode({ referenceId }: { referenceId: string }) {
  // Create bars based on character codes for a more realistic look
  const generateBars = () => {
    const bars: { width: number; gap: boolean }[] = [];
    const cleanId = referenceId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

    for (let i = 0; i < cleanId.length && bars.length < 60; i++) {
      const charCode = cleanId.charCodeAt(i);
      // Each character generates 4-5 bars
      bars.push({ width: charCode % 3 === 0 ? 2 : 1, gap: false });
      bars.push({ width: 1, gap: true });
      bars.push({ width: charCode % 2 === 0 ? 3 : 1, gap: false });
      bars.push({ width: 1, gap: true });
      if (charCode % 4 === 0) {
        bars.push({ width: 2, gap: false });
        bars.push({ width: 1, gap: true });
      }
    }
    return bars.slice(0, 60);
  };

  const bars = generateBars();

  return (
    <div className="flex h-14 items-end justify-center gap-px">
      {bars.map((bar, i) => (
        <div
          key={i}
          className={
            bar.gap ? "bg-transparent" : "bg-neutral-900 dark:bg-white"
          }
          style={{
            width: `${bar.width}px`,
            height: bar.gap ? 0 : "100%",
          }}
        />
      ))}
    </div>
  );
}

// Payment method icon
function PaymentIcon({ channel }: { channel?: string }) {
  if (channel === "100pay") {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600">
        <span className="text-lg">💎</span>
      </div>
    );
  }

  // Paystack/Card icon - Mastercard-style circles
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 p-1">
      <div className="relative flex h-full w-full items-center justify-center">
        <div className="absolute left-0.5 h-4 w-4 rounded-full bg-red-400 opacity-90" />
        <div className="absolute right-0.5 h-4 w-4 rounded-full bg-orange-400 opacity-90" />
      </div>
    </div>
  );
}

export function TransactionReceipt({
  transaction,
  onClose,
  showSuccessHeader = false,
}: TransactionReceiptProps) {
  const isSuccessful = transaction.status === "successful";
  const isPending = transaction.status === "pending";
  const displayCurrency = transaction.currency || "NGN";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Solid overlay backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Receipt card */}
      <div
        className="relative w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top scalloped edge using clip-path */}
        <div className="relative">
          <div
            className="h-6 w-full bg-white dark:bg-neutral-950"
            style={{
              clipPath:
                "polygon(0% 100%, 4% 100%, 6% 50%, 8% 100%, 12% 100%, 14% 50%, 16% 100%, 20% 100%, 22% 50%, 24% 100%, 28% 100%, 30% 50%, 32% 100%, 36% 100%, 38% 50%, 40% 100%, 44% 100%, 46% 50%, 48% 100%, 52% 100%, 54% 50%, 56% 100%, 60% 100%, 62% 50%, 64% 100%, 68% 100%, 70% 50%, 72% 100%, 76% 100%, 78% 50%, 80% 100%, 84% 100%, 86% 50%, 88% 100%, 92% 100%, 94% 50%, 96% 100%, 100% 100%, 100% 100%, 0% 100%)",
            }}
          />
        </div>

        {/* Main content */}
        <div className="relative bg-white px-6 pb-6 dark:bg-neutral-950">
          {/* Header */}
          {showSuccessHeader && isSuccessful ? (
            <div className="mb-6 pt-2 text-center">
              <div className="mb-3 text-5xl">🎉</div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                Thank you!
              </h2>
              <p className="text-sm text-neutral-500">
                Your credits have been added successfully
              </p>
            </div>
          ) : (
            <div className="mb-4 flex items-center justify-between pt-2">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                Transaction Receipt
              </h3>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* Dashed divider with side notches */}
          <div className="relative my-5">
            <div className="border-t-2 border-dashed border-neutral-200 dark:border-neutral-800" />
          </div>

          {/* Transaction Details */}
          <div className="space-y-5">
            {/* ID and Amount row */}
            <div className="flex justify-between gap-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                  Transaction ID
                </span>
                <div className="font-mono text-sm font-bold text-neutral-900 dark:text-white">
                  {(transaction.providerReference || transaction.id).substring(
                    0,
                    14
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                  Amount
                </span>
                <div className="text-xl font-bold text-neutral-900 dark:text-white">
                  {formatCurrency(transaction.amount, {
                    currency: displayCurrency,
                  })}
                </div>
              </div>
            </div>

            {/* Date and Credits row */}
            <div className="flex justify-between gap-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                  Date & Time
                </span>
                <div className="text-sm font-medium text-neutral-900 dark:text-white">
                  {format(
                    new Date(transaction.createdAt),
                    "d MMM yyyy • HH:mm"
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                  Credits
                </span>
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  +{transaction.credits}
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="flex items-center gap-3 rounded-xl bg-neutral-50 p-4 dark:bg-neutral-900/50">
              <PaymentIcon channel={transaction.channel} />
              <div className="flex-1">
                <div className="font-medium capitalize text-neutral-900 dark:text-white">
                  {transaction.channel || transaction.category || "Payment"}
                </div>
                <div className="text-xs text-neutral-500">
                  {transaction.customer?.email || "•••• ••••"}
                </div>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex justify-center">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold capitalize ${
                  isSuccessful
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : isPending
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isSuccessful
                      ? "bg-emerald-500"
                      : isPending
                      ? "bg-amber-500"
                      : "bg-red-500"
                  }`}
                />
                {transaction.status}
              </span>
            </div>
          </div>

          {/* Bottom divider */}
          <div className="relative my-5">
            <div className="border-t-2 border-dashed border-neutral-200 dark:border-neutral-800" />
          </div>

          {/* Barcode */}
          <div className="flex flex-col items-center">
            <Barcode
              referenceId={transaction.providerReference || transaction.id}
            />
            <div className="mt-2 font-mono text-[10px] tracking-[0.2em] text-neutral-400">
              {(transaction.providerReference || transaction.id)
                .toUpperCase()
                .replace(/(.{4})/g, "$1 ")
                .trim()}
            </div>
          </div>

          {/* Done button for success modal */}
          {showSuccessHeader && (
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white transition-all hover:bg-indigo-700 active:scale-[0.98]"
            >
              Done
            </button>
          )}
        </div>

        {/* Bottom scalloped edge */}
        <div
          className="h-6 w-full bg-white dark:bg-neutral-950"
          style={{
            clipPath:
              "polygon(0% 0%, 4% 0%, 6% 50%, 8% 0%, 12% 0%, 14% 50%, 16% 0%, 20% 0%, 22% 50%, 24% 0%, 28% 0%, 30% 50%, 32% 0%, 36% 0%, 38% 50%, 40% 0%, 44% 0%, 46% 50%, 48% 0%, 52% 0%, 54% 50%, 56% 0%, 60% 0%, 62% 50%, 64% 0%, 68% 0%, 70% 50%, 72% 0%, 76% 0%, 78% 50%, 80% 0%, 84% 0%, 86% 50%, 88% 0%, 92% 0%, 94% 50%, 96% 0%, 100% 0%, 100% 0%, 0% 0%)",
          }}
        />
      </div>
    </div>
  );
}
