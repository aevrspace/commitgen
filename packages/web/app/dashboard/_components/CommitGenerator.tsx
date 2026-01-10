"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/aevr/button";
import { Card } from "@/components/ui/aevr/card";
import { MagicStar, Copy } from "iconsax-react";
import { toast } from "sonner";

interface CommitGeneratorProps {
  token: string;
  onCommitGenerated?: () => void; // To refresh credits
}

export const CommitGenerator: React.FC<CommitGeneratorProps> = ({
  token,
  onCommitGenerated,
}) => {
  const [diff, setDiff] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!diff.trim()) {
      toast.error("Please enter a git diff");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/commit/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ diff }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          toast.error("Insufficient credits. Please top up.");
        } else {
          throw new Error(data.error || "Generation failed");
        }
        return;
      }

      // data is array of messages or single message object?
      // checking api/commit/generate logic... it returns `data` which is result from Gemini.
      // Usually it's an array of strings or objects.

      // Let's assume it returns { choices: string[] } or similar, or just the text.
      // Based on previous viewing of generate route:
      // It returns: return NextResponse.json(result);
      // result comes from generateCommitMessage(diff).

      // I'll assume it returns an array of strings or one string.
      // Let's just stringify for now if unsure, or verify structure.
      // Checking `CommitGenProvider.generateCommitMessage` in CLI:
      // It expects `CommitMessage[]`.

      // Ideally the API returns JSON.

      const messages = Array.isArray(data) ? data : [data];
      setResult(
        messages
          .map((m) => (typeof m === "string" ? m : m.message || m.subject))
          .join("\n\n")
      );

      toast.success("Commit message generated!");
      if (onCommitGenerated) onCommitGenerated();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const copyResult = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      toast.success("Copied to clipboard");
    }
  };

  return (
    <Card
      title="Generate Commit"
      subtitle="Paste your git diff below"
      icon={<MagicStar variant="Bulk" color="currentColor" className="icon" />}
      variant="default"
      className="w-full"
    >
      <div className="space-y-4">
        <textarea
          className="w-full h-40 rounded-xl border border-neutral-200 bg-neutral-50 p-4 font-mono text-sm dark:border-neutral-700 dark:bg-neutral-800 focus:outline-hidden focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100"
          placeholder="diff --git a/src/index.ts b/src/index.ts..."
          value={diff}
          onChange={(e) => setDiff(e.target.value)}
        />

        <div className="flex justify-end">
          <Button onClick={handleGenerate} disabled={loading} size="sm">
            {loading ? "Generating..." : "Generate"}
          </Button>
        </div>

        {result && (
          <div className="relative mt-4">
            <div className="w-full rounded-xl bg-neutral-900 p-4 font-mono text-sm text-neutral-100">
              <pre className="whitespace-pre-wrap">{result}</pre>
            </div>
            <Button
              onClick={copyResult}
              variant="secondary"
              size="sm"
              className="absolute right-2 top-2 h-8 w-8 p-0"
              title="Copy result"
            >
              <Copy variant="Bulk" color="currentColor" className="icon" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};
