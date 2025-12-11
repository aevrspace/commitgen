"use client";

import Link from "next/link";
import { Button } from "@/components/ui/aevr/button";
import { Card } from "@/components/ui/aevr/card";
import { ArrowLeft, SecuritySafe, Warning2, Flash, Key } from "iconsax-react";
import { InfoBox } from "../ui/aevr/info-box";

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
        <InfoBox
          type="warning"
          title="Security Best Practices"
          colorScheme={"full"}
          icon={
            <SecuritySafe
              size={24}
              variant="Bulk"
              className="icon"
              color="currentColor"
            />
          }
        >
          <ul className="list-disc space-y-1 pl-4">
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
        </InfoBox>

        {/* Troubleshooting */}
        <InfoBox
          type="default"
          colorScheme={"full"}
          title="Troubleshooting"
          icon={
            <Warning2
              size={24}
              variant="Bulk"
              className="icon"
              color="currentColor"
            />
          }
        >
          <ul className="list-disc space-y-1 pl-4">
            <li>
              <strong>Quota Exceeded:</strong> The free tier is generous (15
              RPM), but if you hit limits, wait a moment or check your billing
              settings.
            </li>
            <li>
              <strong>Region Lock:</strong> Ensure you are in a supported region
              for Google AI Studio.
            </li>
          </ul>
        </InfoBox>
      </div>
    </div>
  );
};
