import Link from "next/link";
import { Button } from "@/components/ui/aevr/button";
import { Card, CardGrid } from "@/components/ui/aevr/card";
import { Command, Cpu, MagicStar } from "iconsax-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-neutral-950">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-8 px-6 py-24 text-center sm:py-32">
          <div className="inline-flex gap-2 items-center rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
            <MagicStar
              size="16"
              className="text-amber-500"
              variant="Bulk"
              color="currentColor"
            />
            <span>AI-Powered Conventional Commits</span>
          </div>
          <h1 className="max-w-4xl text-5xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-6xl sm:leading-tight">
            Stop writing generic <br className="hidden sm:inline" /> commit
            messages.
          </h1>
          <p className="max-w-2xl text-lg text-neutral-600 dark:text-neutral-400">
            CommitGen analyzes your staged changes and generates semantic,
            conventional commit messages instantly. Use it via our CLI or this
            Web Dashboard.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link href="/dashboard">
              <Button size="lg" className="px-8">
                Generate a Commit
              </Button>
            </Link>
            <Link href="https://github.com/aevrhq/commitgen" target="_blank">
              <Button variant="secondary" size="lg" className="px-8">
                View Documentation
              </Button>
            </Link>
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
      </main>
    </div>
  );
}
