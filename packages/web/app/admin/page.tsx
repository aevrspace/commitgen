"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/aevr/button";
import { toast } from "sonner";
import { Setting2, ArrowRotateRight, TickCircle, Lock } from "iconsax-react";
import { usePersistedState } from "@/hooks/aevr/use-persisted-state";

interface PlatformSettings {
  creditsPerUsd: number;
  minPurchaseCredits: number;
  freeCreditsOnSignup: number;
  updatedAt: string;
}

interface User {
  id: string;
  email: string;
  role: "user" | "admin";
}

export default function AdminPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Sync with Global Auth State
  const { state: token, isHydrated } = usePersistedState<string>("", {
    storageKey: "authToken",
  });

  // Form state
  const [creditsPerUsd, setCreditsPerUsd] = useState(80);
  const [minPurchaseCredits, setMinPurchaseCredits] = useState(10);
  const [freeCreditsOnSignup, setFreeCreditsOnSignup] = useState(50);

  useEffect(() => {
    if (!isHydrated) return;

    if (!token) {
      setAuthLoading(false);
      setLoading(false);
      return;
    }

    const init = async () => {
      try {
        setAuthLoading(true);
        // 1. Fetch User Profile to check role
        const userRes = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!userRes.ok) {
          throw new Error("Failed to fetch user profile");
        }

        const userData = await userRes.json();
        setUser(userData);

        if (userData.role !== "admin") {
          setAuthLoading(false);
          setLoading(false);
          return;
        }

        // 2. Fetch Settings if Admin
        await fetchSettings();
      } catch (error) {
        console.error("Initialization failed:", error);
      } finally {
        setAuthLoading(false);
      }
    };

    init();
  }, [token, isHydrated]);

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

  // Handle save
  const handleSave = async () => {
    if (!token) {
      toast.error("Please log in first");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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

  if (!isHydrated || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-neutral-500">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
            <Lock variant="Bulk" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            Access Denied
          </h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            You do not have permission to view this page.
          </p>
          <div className="mt-6">
            <Button
              variant="primary"
              onClick={() => (window.location.href = "/")}
            >
              Return Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="mx-auto max-w-2xl px-6 py-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
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
          <div className="text-right">
            <div className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
              {user.email}
            </div>
            <div className="text-xs text-neutral-500 uppercase tracking-wider">
              Admin Access
            </div>
          </div>
        </div>

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
                  disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
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
                  disabled={saving || !hasChanges}
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
