"use client";

import React from "react";
import { Card } from "@/components/ui/aevr/card";
import { Chart, Coin1, Activity, Timer1 } from "iconsax-react";

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
}

interface DashboardStatsProps {
  data: StatsData | null;
  isLoading: boolean;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  data,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800"
          />
        ))}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const stats = [
    {
      label: "Credits Balance",
      value: data.balance.total,
      icon: Coin1,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "Commits Generated",
      value: data.stats.commitsGenerated,
      icon: Chart,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Last 7 Days",
      value: data.stats.last7DaysUsage,
      subtitle: "commits",
      icon: Activity,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      label: "Last 30 Days",
      value: data.stats.last30DaysUsage,
      subtitle: "commits",
      icon: Timer1,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ];

  // Calculate max for chart scaling
  const maxUsage = Math.max(...data.charts.usageByDay.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            elevation="flat"
            className="relative overflow-hidden"
          >
            <div className="flex items-start justify-between p-4">
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {stat.label}
                </p>
                <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-white">
                  {stat.value.toLocaleString()}
                  {stat.subtitle && (
                    <span className="ml-1 text-sm font-normal text-neutral-400">
                      {stat.subtitle}
                    </span>
                  )}
                </p>
              </div>
              <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                <stat.icon
                  variant="Bulk"
                  color="currentColor"
                  className={`h-5 w-5 ${stat.color}`}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Usage Chart */}
      <Card elevation="flat" className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
              Weekly Activity
            </h3>
            <p className="text-sm text-neutral-500">
              Commit generations over the last 7 days
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-emerald-500" />
              Credits Used
            </span>
          </div>
        </div>

        {/* Simple Bar Chart */}
        <div className="flex h-40 items-end gap-2">
          {data.charts.usageByDay.length > 0 ? (
            data.charts.usageByDay.map((day) => {
              const height = (day.count / maxUsage) * 100;
              const date = new Date(day._id);
              const dayName = date.toLocaleDateString("en-US", {
                weekday: "short",
              });

              return (
                <div
                  key={day._id}
                  className="flex flex-1 flex-col items-center gap-2"
                >
                  <div className="relative flex w-full flex-col items-center">
                    <span className="absolute -top-5 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                      {day.count}
                    </span>
                    <div
                      className="w-full max-w-8 rounded-t-lg bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all"
                      style={{ height: `${Math.max(height, 8)}%` }}
                    />
                  </div>
                  <span className="text-xs text-neutral-500">{dayName}</span>
                </div>
              );
            })
          ) : (
            <div className="flex h-full w-full items-center justify-center text-neutral-400">
              No activity in the last 7 days
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
