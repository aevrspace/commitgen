"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/aevr/button";
import { Card, CardGrid } from "@/components/ui/aevr/card";
import { Flash, Key, Cpu, TickCircle } from "iconsax-react";

interface PlatformSettings {
  creditsPerUsd: number;
  minPurchaseCredits: number;
  freeCreditsOnSignup: number;
}

const CREDIT_TIERS = [
  { name: "Tier 1", tokens: "≤1,500", credits: 1, description: "Small diffs" },
  { name: "Tier 2", tokens: "≤3,000", credits: 2, description: "Medium diffs" },
  { name: "Tier 3", tokens: "≤6,000", credits: 3, description: "Large diffs" },
  {
    name: "Tier 4",
    tokens: ">6,000",
    credits: 4,
    description: "Very large diffs",
  },
];

export default function PricingPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const creditsPerUsd = settings?.creditsPerUsd ?? 80;
  const freeCredits = settings?.freeCreditsOnSignup ?? 50;

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-neutral-950">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-8 px-6 py-24 text-center">
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-5xl">
              Simple, Transparent Pricing
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-neutral-600 dark:text-neutral-400">
              Pay only for what you use. Start free and scale as you grow.
            </p>
          </div>
        </section>

        {/* Pricing Tiers */}
        <section className="border-t border-neutral-100 bg-neutral-50/50 py-16 dark:border-neutral-800 dark:bg-neutral-900/50">
          <div className="mx-auto max-w-5xl px-6">
            <div className="grid gap-8 md:grid-cols-3">
              {/* Free Tier */}
              <div className="relative rounded-2xl border border-neutral-200 bg-white p-8 dark:border-neutral-800 dark:bg-neutral-950">
                <div className="mb-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <Flash variant="Bulk" size={24} color="currentColor" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">
                    Free Starter
                  </h3>
                  <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                    Perfect for trying out CommitGen
                  </p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-neutral-900 dark:text-neutral-50">
                    $0
                  </span>
                  <span className="text-neutral-500 dark:text-neutral-400">
                    {" "}
                    forever
                  </span>
                </div>
                <ul className="mb-8 space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
                  <li className="flex items-center gap-2">
                    <TickCircle
                      variant="Bulk"
                      size={18}
                      className="text-emerald-500"
                    />
                    {loading ? "..." : freeCredits} free credits on signup
                  </li>
                  <li className="flex items-center gap-2">
                    <TickCircle
                      variant="Bulk"
                      size={18}
                      className="text-emerald-500"
                    />
                    Email-based login
                  </li>
                  <li className="flex items-center gap-2">
                    <TickCircle
                      variant="Bulk"
                      size={18}
                      className="text-emerald-500"
                    />
                    Full CLI access
                  </li>
                  <li className="flex items-center gap-2">
                    <TickCircle
                      variant="Bulk"
                      size={18}
                      className="text-emerald-500"
                    />
                    Web dashboard
                  </li>
                </ul>
                <Link href="/dashboard">
                  <Button variant="secondary" size="lg" className="w-full">
                    Get Started Free
                  </Button>
                </Link>
              </div>

              {/* Pay As You Go */}
              <div className="relative rounded-2xl border-2 border-indigo-500 bg-white p-8 shadow-lg dark:bg-neutral-950">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-500 px-3 py-1 text-xs font-medium text-white">
                  Popular
                </div>
                <div className="mb-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                    <Cpu variant="Bulk" size={24} color="currentColor" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">
                    Pay As You Go
                  </h3>
                  <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                    Buy credits when you need them
                  </p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-neutral-900 dark:text-neutral-50">
                    {loading ? "..." : creditsPerUsd}
                  </span>
                  <span className="text-neutral-500 dark:text-neutral-400">
                    {" "}
                    credits/$1
                  </span>
                </div>
                <ul className="mb-8 space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
                  <li className="flex items-center gap-2">
                    <TickCircle
                      variant="Bulk"
                      size={18}
                      className="text-indigo-500"
                    />
                    Flexible top-ups
                  </li>
                  <li className="flex items-center gap-2">
                    <TickCircle
                      variant="Bulk"
                      size={18}
                      className="text-indigo-500"
                    />
                    Multiple payment methods
                  </li>
                  <li className="flex items-center gap-2">
                    <TickCircle
                      variant="Bulk"
                      size={18}
                      className="text-indigo-500"
                    />
                    Credits never expire
                  </li>
                  <li className="flex items-center gap-2">
                    <TickCircle
                      variant="Bulk"
                      size={18}
                      className="text-indigo-500"
                    />
                    Usage-based billing
                  </li>
                </ul>
                <Link href="/credits">
                  <Button variant="primary" size="lg" className="w-full">
                    Buy Credits
                  </Button>
                </Link>
              </div>

              {/* BYOK */}
              <div className="relative rounded-2xl border border-neutral-200 bg-white p-8 dark:border-neutral-800 dark:bg-neutral-950">
                <div className="mb-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <Key variant="Bulk" size={24} color="currentColor" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">
                    Bring Your Own Key
                  </h3>
                  <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                    Use your own Gemini API key
                  </p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-neutral-900 dark:text-neutral-50">
                    Unlimited
                  </span>
                </div>
                <ul className="mb-8 space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
                  <li className="flex items-center gap-2">
                    <TickCircle
                      variant="Bulk"
                      size={18}
                      className="text-blue-500"
                    />
                    Unlimited generations
                  </li>
                  <li className="flex items-center gap-2">
                    <TickCircle
                      variant="Bulk"
                      size={18}
                      className="text-blue-500"
                    />
                    Gemini Flash is free
                  </li>
                  <li className="flex items-center gap-2">
                    <TickCircle
                      variant="Bulk"
                      size={18}
                      className="text-blue-500"
                    />
                    Full privacy control
                  </li>
                  <li className="flex items-center gap-2">
                    <TickCircle
                      variant="Bulk"
                      size={18}
                      className="text-blue-500"
                    />
                    No account required
                  </li>
                </ul>
                <Link href="/docs/api-key">
                  <Button variant="secondary" size="lg" className="w-full">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Credit Usage Table */}
        <section className="bg-white py-16 dark:bg-neutral-950">
          <div className="mx-auto max-w-4xl px-6">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                How Credits Work
              </h2>
              <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400">
                Credits are consumed based on the size of your git diff.
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                      Tier
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                      Token Count
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                      Credits Used
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                      Typical Use Case
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {CREDIT_TIERS.map((tier) => (
                    <tr
                      key={tier.name}
                      className="transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-neutral-900 dark:text-neutral-50">
                        {tier.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">
                        {tier.tokens} tokens
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-sm font-medium text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                          {tier.credits} credit{tier.credits > 1 ? "s" : ""}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">
                        {tier.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
              Most single-file changes use 1-2 credits. Multi-file commits
              typically use 2-4 credits.
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="border-t border-neutral-100 bg-neutral-50/50 py-16 dark:border-neutral-800 dark:bg-neutral-900/50">
          <div className="mx-auto max-w-4xl px-6">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                Frequently Asked Questions
              </h2>
            </div>

            <CardGrid cols={2} spacing="normal">
              <Card title="Do credits expire?" variant="default">
                <p className="text-neutral-600 dark:text-neutral-400">
                  No! Credits you purchase never expire. Use them whenever you
                  need.
                </p>
              </Card>

              <Card
                title="What payment methods do you accept?"
                variant="default"
              >
                <p className="text-neutral-600 dark:text-neutral-400">
                  We accept card payments via Paystack and crypto payments via
                  100Pay.
                </p>
              </Card>

              <Card title="Can I get a refund?" variant="default">
                <p className="text-neutral-600 dark:text-neutral-400">
                  Credits are non-refundable, but they never expire so you can
                  use them at any time.
                </p>
              </Card>

              <Card title="What is BYOK?" variant="default">
                <p className="text-neutral-600 dark:text-neutral-400">
                  Bring Your Own Key (BYOK) lets you use your own Google Gemini
                  API key for unlimited generations without needing credits.
                </p>
              </Card>
            </CardGrid>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-white py-16 dark:bg-neutral-950">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
              Ready to improve your commits?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600 dark:text-neutral-400">
              Start with {freeCredits} free credits. No credit card required.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/dashboard">
                <Button variant="primary" size="lg" className="px-8">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/credits">
                <Button variant="secondary" size="lg" className="px-8">
                  Buy Credits
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
