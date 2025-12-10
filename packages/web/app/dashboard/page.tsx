"use client";

import { useEffect, useState } from "react";
import { LoginForm } from "./_components/LoginForm";
import { VerifyForm } from "./_components/VerifyForm";
import { DashboardView } from "./_components/DashboardView";
import { usePersistedState } from "@/hooks/aevr/use-persisted-state";

export interface UserProfile {
  email: string;
  credits: number;
}

export default function Dashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"login" | "verify" | "dashboard">("login");

  // Use AEVR persisted state hook for auth token
  const {
    state: token,
    setState: setToken,
    resetState,
    isHydrated,
  } = usePersistedState<string>("", { storageKey: "authToken" });

  // Handle initial hydration and token check
  useEffect(() => {
    if (isHydrated && token && step === "login") {
      setStep("dashboard");
    }
  }, [isHydrated, token, step]);

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

  // Show loading state while checking for persisted token
  if (!isHydrated) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 dark:bg-gray-950 md:p-8">
      <div className="mx-auto max-w-4xl">
        {step === "login" && (
          <div className="flex min-h-[80vh] items-center justify-center">
            <LoginForm onSuccess={handleLoginSuccess} />
          </div>
        )}

        {step === "verify" && (
          <div className="flex min-h-[80vh] items-center justify-center">
            <VerifyForm
              email={email}
              onSuccess={handleVerifySuccess}
              onBack={() => setStep("login")}
            />
          </div>
        )}

        {step === "dashboard" && (
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
