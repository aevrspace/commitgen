"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/utils/aevr/number-formatter";
import { format } from "date-fns";
import { usePersistedState } from "@/hooks/aevr/use-persisted-state";

interface Transaction {
  _id: string;
  amount: number;
  fee: number;
  status: string;
  type: string;
  providerReference: string;
  createdAt: string;
  metadata?: {
    credits?: number;
    provider?: string;
    customer?: {
      email?: string;
      name?: string;
      first_name?: string;
      last_name?: string;
    };
    [key: string]: unknown;
  };
}

export function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const { state: token } = usePersistedState<string>("", {
    storageKey: "authToken",
  });

  useEffect(() => {
    if (!token) return;

    const fetchTransactions = async () => {
      try {
        const res = await fetch("/api/transactions?limit=20", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setTransactions(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch transactions", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [token]);

  if (loading)
    return <div className="text-sm text-neutral-500">Loading history...</div>;

  if (transactions.length === 0) {
    return <div className="text-sm text-neutral-500">No transactions yet.</div>;
  }

  return (
    <>
      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950 overflow-hidden">
        <div className="border-b border-neutral-200 bg-neutral-50 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-900/50">
          <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">
            Transaction History
          </h2>
        </div>
        <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {transactions.map((tx) => (
            <div
              key={tx._id}
              className="flex cursor-pointer items-center justify-between px-6 py-4 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
              onClick={() => setSelectedTx(tx)}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      tx.status === "confirmed"
                        ? "bg-green-500"
                        : tx.status === "pending"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                  />
                  <p className="font-medium text-neutral-900 dark:text-neutral-100 capitalize">
                    {tx.type} ({tx.metadata?.provider || "N/A"})
                  </p>
                </div>
                <p className="text-sm text-neutral-500">
                  {format(new Date(tx.createdAt), "MMM d, yyyy • h:mm a")}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                  {formatCurrency(tx.amount + (tx.fee || 0), {
                    currency: "NGN",
                  })}
                </p>
                <p className="text-xs text-neutral-500">
                  {tx.metadata?.credits} Credits
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Details Modal */}
      {selectedTx && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setSelectedTx(null)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-neutral-950"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Transaction Details</h3>
              <button
                onClick={() => setSelectedTx(null)}
                className="text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase text-neutral-500">
                  Status
                </label>
                <div
                  className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                    selectedTx.status === "confirmed"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : selectedTx.status === "pending"
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                  }`}
                >
                  {selectedTx.status}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase text-neutral-500">
                    Amount Paid
                  </label>
                  <div className="text-lg font-medium">
                    {formatCurrency(selectedTx.amount + (selectedTx.fee || 0), {
                      currency: "NGN",
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-neutral-500">
                    Credits Received
                  </label>
                  <div className="text-lg font-medium text-indigo-600 dark:text-indigo-400">
                    {selectedTx.metadata?.credits || 0}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-neutral-500">
                  Reference
                </label>
                <div className="font-mono text-xs text-neutral-700 dark:text-neutral-300 break-all">
                  {selectedTx.providerReference}
                </div>
              </div>

              {selectedTx.metadata?.customer && (
                <div className="rounded-lg bg-neutral-50 p-3 dark:bg-neutral-900/50">
                  <label className="text-xs font-semibold uppercase text-neutral-500 mb-2 block">
                    Payer Info
                  </label>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Name:</span>
                      <span className="font-medium">
                        {selectedTx.metadata.customer.name ||
                          `${selectedTx.metadata.customer.first_name || ""} ${
                            selectedTx.metadata.customer.last_name || ""
                          }`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Email:</span>
                      <span className="font-medium">
                        {selectedTx.metadata.customer.email}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
