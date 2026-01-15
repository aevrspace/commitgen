"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/aevr/button";
import { toast } from "sonner";
import { Setting2, ArrowRotateRight, TickCircle } from "iconsax-react";

interface PlatformSettings {
  creditsPerUsd: number;
  minPurchaseCredits: number;
  freeCreditsOnSignup: number;
  updatedAt: string;
}

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [creditsPerUsd, setCreditsPerUsd] = useState(80);
  const [minPurchaseCredits, setMinPurchaseCredits] = useState(10);
  const [freeCreditsOnSignup, setFreeCreditsOnSignup] = useState(50);

  // Fetch current settings
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        setCreditsPerUsd(data.creditsPerUsd);
        setMinPurchaseCredits(data.minPurchaseCredits);
        setFreeCreditsOnSignup(data.freeCreditsOnSignup);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      toast.error("Failed to fetch settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Handle authentication
  const handleAuthenticate = () => {
    if (adminKey.trim()) {
      setIsAuthenticated(true);
      toast.success("Authenticated");
    } else {
      toast.error("Please enter an admin key");
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!isAuthenticated) {
      toast.error("Please authenticate first");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({
          creditsPerUsd,
          minPurchaseCredits,
          freeCreditsOnSignup,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update settings");
      }

      setSettings(data);
      toast.success("Settings updated successfully");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update settings");
      }
    } finally {
      setSaving(false);
    }
  };

  // Check if there are unsaved changes
  const hasChanges =
    settings &&
    (creditsPerUsd !== settings.creditsPerUsd ||
      minPurchaseCredits !== settings.minPurchaseCredits ||
      freeCreditsOnSignup !== settings.freeCreditsOnSignup);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="mx-auto max-w-2xl px-6 py-12">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
            <Setting2 variant="Bulk" size={24} color="currentColor" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
              Admin Settings
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Manage platform configuration
            </p>
          </div>
        </div>

        {/* Authentication */}
        {!isAuthenticated && (
          <div className="mb-8 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              Authentication Required
            </h2>
            <div className="flex gap-3">
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Enter admin API key"
                className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800"
                onKeyDown={(e) => e.key === "Enter" && handleAuthenticate()}
              />
              <Button variant="primary" onClick={handleAuthenticate}>
                Authenticate
              </Button>
            </div>
          </div>
        )}

        {/* Settings Form */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              Pricing Settings
            </h2>
            <button
              onClick={fetchSettings}
              disabled={loading}
              className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            >
              <ArrowRotateRight
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="py-8 text-center text-neutral-500">
              Loading settings...
            </div>
          ) : (
            <div className="space-y-6">
              {/* Credits per USD */}
              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Credits per USD
                </label>
                <input
                  type="number"
                  min="1"
                  value={creditsPerUsd}
                  onChange={(e) =>
                    setCreditsPerUsd(parseInt(e.target.value) || 1)
                  }
                  disabled={!isAuthenticated}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800"
                />
                <p className="mt-1 text-xs text-neutral-500">
                  Number of credits users receive per $1 USD payment
                </p>
              </div>

              {/* Minimum Purchase Credits */}
              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Minimum Purchase Credits
                </label>
                <input
                  type="number"
                  min="1"
                  value={minPurchaseCredits}
                  onChange={(e) =>
                    setMinPurchaseCredits(parseInt(e.target.value) || 1)
                  }
                  disabled={!isAuthenticated}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800"
                />
                <p className="mt-1 text-xs text-neutral-500">
                  Minimum number of credits for a single purchase
                </p>
              </div>

              {/* Free Credits on Signup */}
              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Free Credits on Signup
                </label>
                <input
                  type="number"
                  min="0"
                  value={freeCreditsOnSignup}
                  onChange={(e) =>
                    setFreeCreditsOnSignup(parseInt(e.target.value) || 0)
                  }
                  disabled={!isAuthenticated}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800"
                />
                <p className="mt-1 text-xs text-neutral-500">
                  Number of free credits given to new users
                </p>
              </div>

              {/* Last Updated */}
              {settings?.updatedAt && (
                <div className="rounded-lg bg-neutral-50 p-3 text-sm text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                  Last updated: {new Date(settings.updatedAt).toLocaleString()}
                </div>
              )}

              {/* Save Button */}
              <div className="flex items-center justify-between pt-4">
                <div>
                  {hasChanges && (
                    <span className="text-sm text-amber-600 dark:text-amber-400">
                      You have unsaved changes
                    </span>
                  )}
                </div>
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={!isAuthenticated || saving || !hasChanges}
                  className="flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <ArrowRotateRight size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <TickCircle variant="Bulk" size={16} />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-900/20">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Note:</strong> Changes to pricing settings will take effect
            immediately for new transactions. Existing pending transactions will
            not be affected.
          </p>
        </div>
      </div>
    </div>
  );
}
