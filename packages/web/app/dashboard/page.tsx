"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { LoginForm } from "./_components/LoginForm";
import { VerifyForm } from "./_components/VerifyForm";
import { DashboardView } from "./_components/DashboardView";
import { usePersistedState } from "@/hooks/aevr/use-persisted-state";
import Loader from "@/components/ui/aevr/loader";

export interface UserProfile {
  email: string;
  credits: number;
}

export default function Dashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"login" | "verify" | "dashboard">("login");
  const searchParams = useSearchParams();
  const router = useRouter();

  // Use AEVR persisted state hook for auth token
  const {
    state: token,
    setState: setToken,
    resetState,
    isHydrated,
  } = usePersistedState<string>("", { storageKey: "authToken" });

  // Handle CLI token from query parameter
  useEffect(() => {
    if (isHydrated) {
      const cliToken = searchParams.get("cli_token");
      if (cliToken) {
        // Set the token from CLI and clean up URL
        setToken(cliToken);
        // Remove cli_token from URL without refresh
        const url = new URL(window.location.href);
        url.searchParams.delete("cli_token");
        router.replace(url.pathname + url.search, { scroll: false });
      }
    }
  }, [isHydrated, searchParams, setToken, router]);

  // Handle initial hydration and token check
  // Derive the current step based on authentication state
  // If we have a valid token (and are hydrated), we should show the dashboard
  const currentStep = token ? "dashboard" : step;

  const handleLoginSuccess = (email: string) => {
    setEmail(email);
    setStep("verify");
  };

  const handleVerifySuccess = (newToken: string, user: UserProfile) => {
    setToken(newToken); // Automatically persists
    setProfile(user);
    setStep("dashboard");
  };

  const handleLogout = () => {
    resetState(); // Clear token and remove from storage
    setProfile(null);
    setStep("login");
  };

  // Fetch user profile if token exists but profile is missing (e.g., after refresh)
  useEffect(() => {
    const fetchProfile = async () => {
      if (token && !profile && isHydrated) {
        try {
          const res = await fetch("/api/auth/me", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (res.ok) {
            const data = await res.json();
            setProfile(data);
          } else {
            // Token invalid or expired
            handleLogout();
          }
        } catch (error) {
          console.error("Failed to fetch profile:", error);
        }
      }
    };

    fetchProfile();
  }, [token, profile, isHydrated]);

  // Show loading state while checking for persisted token
  if (!isHydrated) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader loading className="text-app-theme-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50/50 p-4 dark:bg-neutral-950 md:p-8">
      <div className="mx-auto max-w-4xl">
        {currentStep === "login" && (
          <div className="flex min-h-[80vh] items-center justify-center">
            <LoginForm onSuccess={handleLoginSuccess} />
          </div>
        )}

        {currentStep === "verify" && (
          <div className="flex min-h-[80vh] items-center justify-center">
            <VerifyForm
              email={email}
              onSuccess={handleVerifySuccess}
              onBack={() => setStep("login")}
            />
          </div>
        )}

        {currentStep === "dashboard" && (
          <DashboardView
            user={profile}
            token={token || ""}
            onLogout={handleLogout}
          />
        )}
      </div>
    </div>
  );
}
