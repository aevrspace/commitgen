"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/aevr/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ArrowUp2, ArrowDown2, Code1, Coin1 } from "iconsax-react";
import { formatDistanceToNow } from "date-fns";
import Loader from "@/components/ui/aevr/loader";

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

const ITEMS_PER_PAGE = 5;

export const UsageHistory: React.FC<UsageHistoryProps> = ({
  transactions: initialTransactions,
  usage: initialUsage,
  isLoading: initialLoading,
}) => {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <TransactionsList initialData={initialTransactions} />
      <CommitsList initialData={initialUsage} />
    </div>
  );
};

const TransactionsList = ({ initialData }: { initialData: Transaction[] }) => {
  const [data, setData] = useState<Transaction[]>(initialData);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  // If initialData is empty or we advanced page, we might need to fetch
  // Actually, standard pattern: use initialData for first render, then fetch.
  // But simpler: just fetch on page change, and initial load.
  // However, parent passes initialData.

  // To keep it simple: We will fetch if page > 1 or if we want to refresh.
  // But the initialData is only "recent 10", whereas we want pagination.
  // So we should probably just fetch from the API to get the correct totalPages and paginated data.
  // But to avoid flicker, we can show initialData while fetching.

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/user/transactions?page=${page}&limit=${ITEMS_PER_PAGE}`
        );
        if (!res.ok) {
          console.error(
            "Failed to fetch transactions:",
            res.status,
            res.statusText
          );
          setData([]);
          setTotalPages(1);
          return;
        }
        const json = await res.json();
        setData(json.transactions || []);
        setTotalPages(json.pagination?.pages || 1);
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setData([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page]);

  return (
    <Card elevation="flat" className="flex flex-col p-4 h-full">
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

      <div className="flex-1">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader loading className="text-app-theme-600" />
          </div>
        ) : data.length > 0 ? (
          <Table>
            <TableBody>
              {data.map((tx) => (
                <TransactionRow key={tx._id} tx={tx} />
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="py-8 text-center text-neutral-400">
            No transactions yet
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={
                    page === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
              <span className="flex items-center text-sm text-neutral-500">
                Page {page} of {totalPages}
              </span>
              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className={
                    page === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </Card>
  );
};

const TransactionRow = ({ tx }: { tx: Transaction }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isCredit = ["credit", "deposit"].includes(tx.type);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} asChild>
      <>
        <TableRow className="cursor-pointer border-none hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
          <TableCell className="p-2">
            <CollapsibleTrigger asChild>
              <div className="flex w-full items-center justify-between">
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
            </CollapsibleTrigger>
          </TableCell>
        </TableRow>
        <CollapsibleContent asChild>
          <TableRow className="border-b border-neutral-100 dark:border-neutral-800">
            <TableCell colSpan={1} className="p-0">
              <div className="mx-1 mb-2 rounded-b-lg bg-neutral-50 p-4 dark:bg-neutral-900">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-neutral-500">
                      Transaction ID
                    </span>
                    <span className="font-mono text-xs text-neutral-700 dark:text-neutral-300">
                      {tx._id}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-neutral-500">
                      Status
                    </span>
                    <span className="capitalize text-neutral-700 dark:text-neutral-300">
                      {tx.status}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-neutral-500">
                      Amount
                    </span>
                    <span className="text-neutral-700 dark:text-neutral-300">
                      {(tx.amount / 100).toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                      })}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-neutral-500">
                      Date
                    </span>
                    <span className="text-neutral-700 dark:text-neutral-300">
                      {new Date(tx.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {tx.metadata?.provider && (
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-neutral-500">
                        Provider
                      </span>
                      <span className="capitalize text-neutral-700 dark:text-neutral-300">
                        {tx.metadata.provider}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </TableCell>
          </TableRow>
        </CollapsibleContent>
      </>
    </Collapsible>
  );
};

const CommitsList = ({ initialData }: { initialData: UsageEntry[] }) => {
  const [data, setData] = useState<UsageEntry[]>(initialData);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/user/commits?page=${page}&limit=${ITEMS_PER_PAGE}`
        );
        if (!res.ok) {
          console.error("Failed to fetch commits:", res.status, res.statusText);
          setData([]);
          setTotalPages(1);
          return;
        }
        const json = await res.json();
        setData(json.usage || []);
        setTotalPages(json.pagination?.pages || 1);
      } catch (err) {
        console.error("Error fetching commits:", err);
        setData([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page]);

  return (
    <Card elevation="flat" className="flex flex-col p-4 h-full">
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

      <div className="flex-1">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader loading className="text-app-theme-600" />
          </div>
        ) : data.length > 0 ? (
          <Table>
            <TableBody>
              {data.map((entry) => (
                <CommitRow key={entry._id} entry={entry} />
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="py-8 text-center text-neutral-400">
            No commits generated yet
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={
                    page === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
              <span className="flex items-center text-sm text-neutral-500">
                Page {page} of {totalPages}
              </span>
              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className={
                    page === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </Card>
  );
};

const CommitRow = ({ entry }: { entry: UsageEntry }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} asChild>
      <>
        <TableRow className="cursor-pointer border-none hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
          <TableCell className="p-2">
            <CollapsibleTrigger asChild>
              <div className="flex w-full items-center justify-between">
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
            </CollapsibleTrigger>
          </TableCell>
        </TableRow>
        <CollapsibleContent asChild>
          <TableRow className="border-b border-neutral-100 dark:border-neutral-800">
            <TableCell colSpan={1} className="p-0">
              <div className="mx-1 mb-2 rounded-b-lg bg-neutral-50 p-4 dark:bg-neutral-900">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-neutral-500">
                      Model
                    </span>
                    <span className="text-neutral-700 dark:text-neutral-300">
                      {entry.metadata?.model || "N/A"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-neutral-500">
                      Diff Length
                    </span>
                    <span className="text-neutral-700 dark:text-neutral-300">
                      {entry.metadata?.diffLength?.toLocaleString() || 0}{" "}
                      characters
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-neutral-500">
                      Generated Length
                    </span>
                    <span className="text-neutral-700 dark:text-neutral-300">
                      {entry.metadata?.responseLength?.toLocaleString() || 0}{" "}
                      characters
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-neutral-500">
                      Date
                    </span>
                    <span className="text-neutral-700 dark:text-neutral-300">
                      {new Date(entry.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 col-span-2">
                    <span className="text-xs font-medium text-neutral-500">
                      Usage ID
                    </span>
                    <span className="font-mono text-xs text-neutral-700 dark:text-neutral-300">
                      {entry._id}
                    </span>
                  </div>
                </div>
              </div>
            </TableCell>
          </TableRow>
        </CollapsibleContent>
      </>
    </Collapsible>
  );
};
