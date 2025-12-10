"use client";

import React from "react";
import { UserProfile } from "@/app/dashboard/page"; // Will move type in next step
import SummaryCard from "@/components/ui/aevr/summary-card";
import { Card } from "@/components/ui/aevr/card";
import { Button } from "@/components/ui/aevr/button";
import { LogoutCurve, Copy, Key } from "iconsax-react";

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
  const copyToken = () => {
    navigator.clipboard.writeText(token);
    // Could add toast notification here
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <Button onClick={onLogout} variant="danger" size="sm" className="gap-2">
          <LogoutCurve variant="Bulk" color="currentColor" className="icon" />
          Logout
        </Button>
      </div>

      <SummaryCard
        layout="horizontal"
        items={[
          {
            label: "Available Credits",
            value: user?.credits?.toString() ?? "0",
            content: (
              <span className="text-xs text-gray-500 mt-1">
                Used to generate commit messages
              </span>
            ),
          },
          {
            label: "Account Email",
            value: user?.email ?? "Unknown",
          },
        ]}
      />

      <Card
        title="Authentication Token"
        subtitle="Use this token to authenticate the CLI"
        icon={<Key variant="Bulk" color="currentColor" className="icon" />}
        variant="default"
        elevation="flat"
        className="w-full"
      >
        <div className="relative">
          <div className="w-full rounded-xl bg-gray-100 p-4 font-mono text-sm break-all text-gray-800 dark:bg-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
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
        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          Run{" "}
          <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800 dark:bg-gray-800 dark:text-gray-200">
            commitgen login
          </code>{" "}
          in your terminal or use this token in your configuration.
        </p>
      </Card>
    </div>
  );
};
