"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { usePersistedState } from "@/hooks/aevr/use-persisted-state";
import { TransactionReceipt } from "./TransactionReceipt";

interface Transaction {
  _id: string;
  amount: number;
  fee: number;
  status: string;
  type: string;
  symbol: string;
  category: string;
  channel?: string;
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "successful":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "failed":
        return "bg-red-500";
      case "reversed":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

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
                    className={`inline-block h-2 w-2 rounded-full ${getStatusColor(
                      tx.status
                    )}`}
                  />
                  <p className="font-medium text-neutral-900 dark:text-neutral-100 capitalize">
                    {tx.category} (
                    {tx.channel || tx.metadata?.provider || "N/A"})
                  </p>
                </div>
                <p className="text-sm text-neutral-500">
                  {format(new Date(tx.createdAt), "MMM d, yyyy • h:mm a")}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`font-medium ${
                    tx.type === "credit"
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {tx.type === "credit" ? "+" : "-"}
                  {tx.amount} {tx.symbol}
                </p>
                {tx.symbol === "CREDITS" && (
                  <p className="text-xs text-neutral-500">
                    {tx.amount} Credits
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Receipt Modal */}
      {selectedTx && (
        <TransactionReceipt
          transaction={{
            id: selectedTx._id,
            amount:
              (selectedTx.metadata?.chargeAmount as number) ||
              selectedTx.amount,
            credits: selectedTx.amount,
            currency:
              selectedTx.symbol === "CREDITS" ? "NGN" : selectedTx.symbol,
            status: selectedTx.status,
            category: selectedTx.category,
            channel: selectedTx.channel || selectedTx.metadata?.provider,
            providerReference: selectedTx.providerReference,
            createdAt: selectedTx.createdAt,
            customer: selectedTx.metadata?.customer,
          }}
          onClose={() => setSelectedTx(null)}
        />
      )}
    </>
  );
}
