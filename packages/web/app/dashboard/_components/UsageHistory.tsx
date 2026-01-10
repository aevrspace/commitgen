"use client";

import React from "react";
import { Card } from "@/components/ui/aevr/card";
import { formatDistanceToNow } from "date-fns";
import { ArrowUp2, ArrowDown2, Code1, Coin1 } from "iconsax-react";

interface Transaction {
  _id: string;
  type: string;
  credits: number;
  amount: number;
  status: string;
  createdAt: string;
  metadata?: {
    provider?: string;
    usageType?: string;
  };
}

interface UsageEntry {
  _id: string;
  type: string;
  creditsUsed: number;
  createdAt: string;
  metadata?: {
    model?: string;
    diffLength?: number;
    responseLength?: number;
  };
}

interface UsageHistoryProps {
  transactions: Transaction[];
  usage: UsageEntry[];
  isLoading: boolean;
}

export const UsageHistory: React.FC<UsageHistoryProps> = ({
  transactions,
  usage,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-64 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Recent Transactions */}
      <Card elevation="flat" className="p-4">
        <div className="mb-4 flex items-center gap-2">
          <Coin1
            variant="Bulk"
            color="currentColor"
            className="h-5 w-5 text-emerald-500"
          />
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Recent Transactions
          </h3>
        </div>

        <div className="space-y-3">
          {transactions.length > 0 ? (
            transactions.slice(0, 5).map((tx) => {
              const isCredit = ["credit", "deposit"].includes(tx.type);
              return (
                <div
                  key={tx._id}
                  className="flex items-center justify-between rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-lg p-2 ${
                        isCredit
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDown2
                          variant="Bulk"
                          color="currentColor"
                          className="h-4 w-4"
                        />
                      ) : (
                        <ArrowUp2
                          variant="Bulk"
                          color="currentColor"
                          className="h-4 w-4"
                        />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-900 dark:text-white">
                        {isCredit ? "Credits Added" : "Credits Used"}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {tx.metadata?.provider ||
                          tx.metadata?.usageType ||
                          tx.type}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${
                        isCredit ? "text-emerald-500" : "text-red-500"
                      }`}
                    >
                      {isCredit ? "+" : "-"}
                      {tx.credits}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {formatDistanceToNow(new Date(tx.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-neutral-400">
              No transactions yet
            </div>
          )}
        </div>
      </Card>

      {/* Recent Usage */}
      <Card elevation="flat" className="p-4">
        <div className="mb-4 flex items-center gap-2">
          <Code1
            variant="Bulk"
            color="currentColor"
            className="h-5 w-5 text-blue-500"
          />
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Recent Commits
          </h3>
        </div>

        <div className="space-y-3">
          {usage.length > 0 ? (
            usage.slice(0, 5).map((entry) => (
              <div
                key={entry._id}
                className="flex items-center justify-between rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800/50"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-500/10 p-2 text-blue-500">
                    <Code1
                      variant="Bulk"
                      color="currentColor"
                      className="h-4 w-4"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">
                      Commit Generated
                    </p>
                    <p className="text-xs text-neutral-500">
                      {entry.metadata?.model || "AI Model"} •{" "}
                      {entry.metadata?.diffLength
                        ? `${entry.metadata.diffLength} chars`
                        : ""}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">
                    -{entry.creditsUsed} credit
                  </p>
                  <p className="text-xs text-neutral-400">
                    {formatDistanceToNow(new Date(entry.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-neutral-400">
              No commits generated yet
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
