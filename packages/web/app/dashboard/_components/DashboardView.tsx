"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { UserProfile } from "@/app/dashboard/page";
import { Card } from "@/components/ui/aevr/card";
import { Button } from "@/components/ui/aevr/button";
import { CommitGenerator } from "./CommitGenerator";
import { DashboardStats } from "./DashboardStats";
import { UsageHistory } from "./UsageHistory";
import { LogoutCurve, Copy, Key } from "iconsax-react";
import { toast } from "sonner";

interface StatsData {
  balance: {
    total: number;
    wallet: number;
    legacy: number;
  };
  stats: {
    totalCreditsAdded: number;
    totalCreditsUsed: number;
    commitsGenerated: number;
    last7DaysUsage: number;
    last30DaysUsage: number;
  };
  charts: {
    usageByDay: Array<{ _id: string; count: number; credits: number }>;
  };
  recent: {
    usage: Array<{
      _id: string;
      type: string;
      creditsUsed: number;
      createdAt: string;
      metadata?: {
        model?: string;
        diffLength?: number;
        responseLength?: number;
      };
    }>;
    transactions: Array<{
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
    }>;
  };
}

interface DashboardViewProps {
  user: UserProfile | null;
  token: string;
  onLogout: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  token,
  onLogout,
}) => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const copyToken = () => {
    navigator.clipboard.writeText(token);
    toast.success("Token copied to clipboard");
  };

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/user/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, [token]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-sm text-neutral-500">
            Welcome back, {user?.email?.split("@")[0] || "User"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/credits">
            <Button variant="secondary" size="sm">
              Top Up Credits
            </Button>
          </Link>
          <Button
            onClick={onLogout}
            variant="danger"
            size="sm"
            className="gap-2"
          >
            <LogoutCurve variant="Bulk" color="currentColor" className="icon" />
            Logout
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <DashboardStats data={stats} isLoading={isLoadingStats} />

      {/* Recent Activity */}
      <UsageHistory
        transactions={stats?.recent?.transactions || []}
        usage={stats?.recent?.usage || []}
        isLoading={isLoadingStats}
      />

      {/* Auth Token Card */}
      <Card
        title="Authentication Token"
        subtitle="Use this token to authenticate the CLI"
        icon={<Key variant="Bulk" color="currentColor" className="icon" />}
        variant="default"
        elevation="flat"
        className="w-full"
      >
        <div className="relative">
          <div className="w-full rounded-xl bg-neutral-100 p-4 font-mono text-sm break-all text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
            {token}
          </div>
          <Button
            onClick={copyToken}
            variant="secondary"
            size="sm"
            className="absolute right-2 top-2 h-8 w-8 p-0"
            title="Copy to clipboard"
          >
            <Copy variant="Bulk" color="currentColor" className="icon" />
          </Button>
        </div>
        <p className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">
          Run{" "}
          <code className="bg-neutral-100 px-1 py-0.5 rounded text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
            commitgen login
          </code>{" "}
          in your terminal or use this token in your configuration.
        </p>
      </Card>

      {/* Commit Generator */}
      <CommitGenerator
        token={token}
        onCommitGenerated={() => {
          // Refresh stats after generating a commit
          setIsLoadingStats(true);
          fetch("/api/user/stats", {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((res) => res.json())
            .then(setStats)
            .finally(() => setIsLoadingStats(false));
        }}
      />
    </div>
  );
};
