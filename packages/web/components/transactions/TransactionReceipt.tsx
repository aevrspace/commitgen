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

// Deterministic barcode generator based on reference ID
function Barcode({ referenceId }: { referenceId: string }) {
  // Create deterministic "random" values from the reference ID
  const bars = Array.from({ length: 30 }).map((_, i) => {
    const charCode = referenceId.charCodeAt(i % referenceId.length) || 65;
    const width = charCode % 2 === 0 ? "2px" : "1px";
    const height = `${24 + (charCode % 24)}px`;
    return { width, height };
  });

  return (
    <div className="mb-2 flex h-12 items-center justify-center gap-0.5">
      {bars.map((bar, i) => (
        <div
          key={i}
          className="bg-neutral-900 dark:bg-white"
          style={{ width: bar.width, height: bar.height }}
        />
      ))}
    </div>
  );
}

export function TransactionReceipt({
  transaction,
  onClose,
  showSuccessHeader = false,
}: TransactionReceiptProps) {
  const isSuccessful = transaction.status === "successful";
  const displayCurrency = transaction.currency || "NGN";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-950"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Scalloped top edge */}
        <div className="absolute -top-3 left-0 right-0 flex justify-between px-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="h-6 w-6 rounded-full bg-neutral-100 dark:bg-neutral-900"
            />
          ))}
        </div>

        {/* Content */}
        <div className="px-6 pb-6 pt-8">
          {/* Header */}
          {showSuccessHeader && isSuccessful && (
            <div className="mb-6 text-center">
              <div className="mb-3 text-5xl">🎉</div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                Thank you!
              </h2>
              <p className="text-sm text-neutral-500">
                Your payment has been processed successfully
              </p>
            </div>
          )}

          {!showSuccessHeader && (
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                Transaction Receipt
              </h3>
              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                ✕
              </button>
            </div>
          )}

          {/* Dashed divider with scallops */}
          <div className="relative my-6">
            <div className="absolute -left-6 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-neutral-100 dark:bg-neutral-900" />
            <div className="absolute -right-6 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-neutral-100 dark:bg-neutral-900" />
            <div className="border-t-2 border-dashed border-neutral-200 dark:border-neutral-800" />
          </div>

          {/* Transaction Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-neutral-500">
                Transaction ID
              </span>
              <span className="text-xs font-semibold uppercase text-neutral-500">
                Amount
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-bold text-neutral-900 dark:text-white">
                {transaction.providerReference?.substring(0, 14) ||
                  transaction.id.substring(0, 14)}
              </span>
              <span className="text-lg font-bold text-neutral-900 dark:text-white">
                {formatCurrency(transaction.amount, {
                  currency: displayCurrency,
                })}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase text-neutral-500">
                  Date & Time
                </span>
                <div className="font-medium text-neutral-900 dark:text-white">
                  {format(
                    new Date(transaction.createdAt),
                    "d MMM yyyy • HH:mm"
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold uppercase text-neutral-500">
                  Credits
                </span>
                <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                  +{transaction.credits}
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="flex items-center gap-3 rounded-lg bg-neutral-50 p-3 dark:bg-neutral-900/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-orange-400 to-red-500 text-white text-lg font-bold">
                {transaction.channel === "100pay" ? "💎" : "💳"}
              </div>
              <div>
                <div className="font-medium text-neutral-900 dark:text-white capitalize">
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
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize ${
                  isSuccessful
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : transaction.status === "pending"
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {transaction.status}
              </span>
            </div>
          </div>

          {/* Dashed divider */}
          <div className="relative my-6">
            <div className="absolute -left-6 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-neutral-100 dark:bg-neutral-900" />
            <div className="absolute -right-6 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-neutral-100 dark:bg-neutral-900" />
            <div className="border-t-2 border-dashed border-neutral-200 dark:border-neutral-800" />
          </div>

          {/* Reference Barcode Placeholder */}
          <div className="flex flex-col items-center">
            <Barcode
              referenceId={transaction.providerReference || transaction.id}
            />
            <div className="font-mono text-[10px] tracking-widest text-neutral-400">
              {transaction.providerReference || transaction.id}
            </div>
          </div>

          {showSuccessHeader && (
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-xl bg-indigo-600 py-3 font-medium text-white transition-colors hover:bg-indigo-700"
            >
              Done
            </button>
          )}
        </div>

        {/* Scalloped bottom edge */}
        <div className="absolute -bottom-3 left-0 right-0 flex justify-between px-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="h-6 w-6 rounded-full bg-neutral-100 dark:bg-neutral-900"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
