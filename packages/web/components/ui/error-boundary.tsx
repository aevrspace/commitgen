"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/aevr/button";
import { Warning2 } from "iconsax-react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  className?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className={`rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-900/10 ${this.props.className}`}
        >
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <div className="rounded-full bg-red-100 p-3 text-red-600 dark:bg-red-900/30 dark:text-red-400">
              <Warning2 variant="Bulk" size={32} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Something went wrong
              </h3>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                {this.state.error?.message ||
                  "An unexpected error occurred while loading this component."}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => this.setState({ hasError: false })}
            >
              Try again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
