"use client";

import Link from "next/link";
import { Button } from "@/components/ui/aevr/button";
import { Card } from "@/components/ui/aevr/card";
import { ArrowLeft, SecuritySafe, Warning2, Flash, Key } from "iconsax-react";

export const ApiKeyGuide = () => {
  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-24 pt-12">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300"
      >
        <ArrowLeft
          color="currentColor"
          variant="Bulk"
          className="icon"
          size={16}
        />
        Back to Home
      </Link>

      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          How to get a Google AI API Key
        </h1>
        <p className="text-xl text-neutral-600 dark:text-neutral-400">
          Getting an API key from Google AI Studio is quick and free. Follow
          these steps to start generating commits with your own key.
        </p>
      </div>

      <div className="grid gap-8">
        {/* Step 1 */}
        <Card
          title="1. Navigate to Google AI Studio"
          variant="default"
          className="relative overflow-hidden"
        >
          <div className="absolute top-4 right-4 text-emerald-500/10">
            <Flash
              color="currentColor"
              variant="Bulk"
              className="icon"
              size={120}
            />
          </div>
          <div className="relative z-10">
            <p className="mb-4 text-neutral-600 dark:text-neutral-400">
              Go to{" "}
              <Link
                href="https://aistudio.google.com"
                target="_blank"
                className="text-emerald-500 hover:underline font-medium"
              >
                aistudio.google.com
              </Link>
              .
            </p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                window.open("https://aistudio.google.com", "_blank")
              }
            >
              Open Site ↗
            </Button>
          </div>
        </Card>

        {/* Step 2 */}
        <Card title="2. Sign In" variant="default">
          <p className="text-neutral-600 dark:text-neutral-400">
            Log in with your Google Account. If this is your first time, you may
            need to accept the terms of service.
          </p>
        </Card>

        {/* Step 3 */}
        <Card title="3. Locate API Key Section" variant="default">
          <div className="flex gap-4 items-start">
            <div className="shrink-0 mt-1">
              <Key
                color="currentColor"
                variant="Bulk"
                size={24}
                className="text-emerald-500 icon"
              />
            </div>
            <p className="text-neutral-600 dark:text-neutral-400">
              Look at the top-left corner of the interface. You should see a
              button labeled <strong>&quot;Get API key&quot;</strong> (often
              indicated by a key icon). Click it.
            </p>
          </div>
        </Card>

        {/* Step 4 & 5 */}
        <Card title="4. Create & Copy Key" variant="default">
          <div className="space-y-4">
            <p className="text-neutral-600 dark:text-neutral-400">
              Click <strong>&quot;Create API key&quot;</strong>. You can choose
              to create it in a new project (easiest) or an existing one.
            </p>
            <div className="rounded-lg bg-neutral-950 p-4 border border-emerald-500/20">
              <p className="text-emerald-400 font-mono text-sm break-all">
                AIzaSyD-EXAMPLE-KEY-DO-NOT-SHARE
              </p>
            </div>
            <p className="text-sm text-neutral-500">
              <strong>Important:</strong> Copy this key immediately. You
              won&apos;t be able to see it again after closing the dialog.
            </p>
          </div>
        </Card>

        {/* Security Warning */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/30 dark:bg-amber-900/10">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400">
              <SecuritySafe
                color="currentColor"
                variant="Bulk"
                className="icon"
                size={24}
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-200">
                Security Best Practices
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-amber-800 dark:text-amber-400">
                <li>
                  <strong>Never share your API key.</strong> Do not post it on
                  public forums or commit it to GitHub.
                </li>
                <li>
                  <strong>Use Environment Variables.</strong> Store it in a{" "}
                  <code>.env</code> file or use <code>commitgen config</code>{" "}
                  securely.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-800 dark:bg-neutral-900/50">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-neutral-200 p-2 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
              <Warning2
                color="currentColor"
                variant="Bulk"
                className="icon"
                size={24}
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-200">
                Troubleshooting
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-neutral-600 dark:text-neutral-400">
                <li>
                  <strong>Quota Exceeded:</strong> The free tier is generous (15
                  RPM), but if you hit limits, wait a moment or check your
                  billing settings.
                </li>
                <li>
                  <strong>Region Lock:</strong> Ensure you are in a supported
                  region for Google AI Studio.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
