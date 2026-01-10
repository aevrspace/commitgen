"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/aevr/button";
import { usePersistedState } from "@/hooks/aevr/use-persisted-state";
import { LogoutCurve, User as UserIcon, Wallet, Setting2 } from "iconsax-react";

interface UserData {
  email: string;
  credits: number;
}

export const HeaderUserMenu: React.FC = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    state: token,
    resetState,
    isHydrated,
  } = usePersistedState<string>("", { storageKey: "authToken" });

  // Check auth and fetch user data
  useEffect(() => {
    const checkAuth = async () => {
      if (!isHydrated) return;

      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          // Token invalid
          setUser(null);
          resetState();
        }
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [token, isHydrated, resetState]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    resetState();
    setUser(null);
    setIsOpen(false);
    window.location.href = "/";
  };

  // Loading state
  if (!isHydrated || isLoading) {
    return (
      <div className="h-8 w-20 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
    );
  }

  // Not logged in
  if (!user) {
    return (
      <Link href="/dashboard">
        <Button variant="primary" size="sm">
          Get Started
        </Button>
      </Link>
    );
  }

  // Logged in - show avatar dropdown
  const initials = user.email.substring(0, 2).toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full bg-neutral-100 p-1 pr-3 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white">
          {initials}
        </div>
        <span className="hidden text-sm font-medium text-neutral-700 dark:text-neutral-300 sm:block">
          {user.credits} credits
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-neutral-200 bg-white p-2 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
          {/* User info */}
          <div className="border-b border-neutral-100 px-3 py-2 dark:border-neutral-800">
            <p className="text-sm font-medium text-neutral-900 dark:text-white">
              {user.email}
            </p>
            <p className="text-xs text-neutral-500">
              {user.credits} credits available
            </p>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              <UserIcon
                variant="Bulk"
                color="currentColor"
                className="h-4 w-4"
              />
              Dashboard
            </Link>
            <Link
              href="/credits"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              <Wallet variant="Bulk" color="currentColor" className="h-4 w-4" />
              Top Up Credits
            </Link>
            <Link
              href="/docs/api-key"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              <Setting2
                variant="Bulk"
                color="currentColor"
                className="h-4 w-4"
              />
              API Docs
            </Link>
          </div>

          {/* Logout */}
          <div className="border-t border-neutral-100 pt-1 dark:border-neutral-800">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
            >
              <LogoutCurve
                variant="Bulk"
                color="currentColor"
                className="h-4 w-4"
              />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
