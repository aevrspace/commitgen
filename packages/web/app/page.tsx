import Link from "next/link";
import { Button } from "@/components/ui/aevr/button";
import { Card, CardGrid } from "@/components/ui/aevr/card";
import { Command, Cpu, MagicStar, Key, Flash } from "iconsax-react";
import { TerminalDemo } from "@/components/landing/terminal-demo";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-neutral-950">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-12 px-6 py-24 text-center sm:py-32">
          <div className="flex flex-col items-center gap-6">
            <div className="inline-flex gap-2 items-center rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
              <MagicStar
                size="16"
                className="text-amber-500"
                variant="Bulk"
                color="currentColor"
              />
              <span>AI-Powered Conventional Commits</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-6xl">
              Stop writing generic{" "}
              <span className="text-neutral-500">commit messages.</span>
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-neutral-600 dark:text-neutral-400">
              Generate meaningful, conventional commit messages from your git
              diffs in seconds. CLI tool and web dashboard included.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/dashboard">
                <Button variant="primary" size="lg" className="px-8">
                  Generate a Commit
                </Button>
              </Link>
              <Link href="https://github.com/aevrhq/commitgen" target="_blank">
                <Button variant="secondary" size="lg" className="px-8">
                  View Documentation
                </Button>
              </Link>
            </div>
          </div>

          <div className="w-full">
            <TerminalDemo />
          </div>
        </section>

        {/* Features Section */}
        <section className="border-t border-neutral-100 bg-neutral-50/50 py-24 dark:border-neutral-800 dark:bg-neutral-900/50">
          <div className="mx-auto max-w-4xl px-6">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                Workflow Superpowers
              </h2>
              <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400">
                Everything you need to maintain a clean git history.
              </p>
            </div>

            <CardGrid cols={3} spacing="normal">
              <Card
                title="CLI Tool"
                subtitle="Terminal Integration"
                icon={<Command size="24" variant="Bulk" color="currentColor" />}
                variant="default"
              >
                <p className="text-neutral-600 dark:text-neutral-400">
                  Run <code>commitgen</code> in any git repository to generate
                  messages directly from your terminal. seamless and fast.
                </p>
              </Card>

              <Card
                title="Web Dashboard"
                subtitle="Visual Management"
                icon={
                  <MagicStar size="24" variant="Bulk" color="currentColor" />
                }
                variant="default"
              >
                <p className="text-neutral-600 dark:text-neutral-400">
                  Manage your credits, view usage history, and generate commits
                  from pasted diffs in a beautiful interface.
                </p>
              </Card>

              <Card
                title="AI Powered"
                subtitle="Smart Analysis"
                icon={<Cpu size="24" variant="Bulk" color="currentColor" />}
                variant="default"
              >
                <p className="text-neutral-600 dark:text-neutral-400">
                  Powered by advanced LLMs to understand code context, adhering
                  strictly to Conventional Commits standards.
                </p>
              </Card>
            </CardGrid>
          </div>
        </section>

        {/* Configuration Section */}
        <section className="bg-white py-24 dark:bg-neutral-950">
          <div className="mx-auto max-w-4xl px-6">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                Flexible Configuration
              </h2>
              <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400">
                Run the config command to choose how you want to power your
                commit generation.
              </p>
            </div>

            <div className="bg-neutral-900 rounded-xl p-8 mb-12 shadow-2xl overflow-hidden relative group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500" />
              <div className="font-mono text-sm text-neutral-400 mb-2 select-none">
                $ Configure your provider
              </div>
              <div className="font-mono text-xl text-white">
                <span className="text-emerald-400 select-none">❯</span>{" "}
                commitgen config
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Free Tier */}
              <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 hover:border-emerald-500/50 transition-all hover:shadow-lg dark:hover:shadow-emerald-900/10">
                <div className="h-12 w-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6">
                  <Flash
                    variant="Bulk"
                    size={24}
                    color="currentColor"
                    className="icon"
                  />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">
                  Free Starter
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                  Perfect for trying out the tool. No credit card or API key
                  required.
                </p>
                <ul className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span> 50 Free Credits
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span> Simple Email
                    Login
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span> Instant Setup
                  </li>
                </ul>
              </div>

              {/* BYOK */}
              <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 hover:border-blue-500/50 transition-all hover:shadow-lg dark:hover:shadow-blue-900/10">
                <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6">
                  <Key
                    variant="Bulk"
                    size={24}
                    className="icon"
                    color="currentColor"
                  />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">
                  Bring Your Own Key
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                  Connect your own Google Gemini API key for unlimited
                  controlled usage.{" "}
                  <Link
                    href="/docs/api-key"
                    className="text-blue-500 hover:underline inline-flex items-center gap-1"
                  >
                    Learn how <span aria-hidden="true">&rarr;</span>
                  </Link>
                </p>
                <ul className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500">✓</span> Unlimited
                    Generation
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500">✓</span> Use Free Gemini
                    Flash
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500">✓</span> Full Privacy
                    Control
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
