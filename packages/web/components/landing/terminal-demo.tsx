"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

const TABS = [
  {
    id: "npx",
    label: "NPX",
    command: "npx @untools/commitgen",
    showInstall: false,
  },
  {
    id: "global",
    label: "Global",
    command: "npm i -g @untools/commitgen",
    showInstall: true,
  },
  {
    id: "local",
    label: "Local",
    command: "npm i -D @untools/commitgen",
    showInstall: true,
  },
];

type TerminalLine =
  | { type: "command"; content: string; delay?: number }
  | { type: "output"; content: React.ReactNode; delay?: number }
  | { type: "menu"; items: string[]; delay?: number };

const CLI_STEPS: TerminalLine[] = [
  {
    type: "output",
    content: (
      <div className="text-emerald-400 font-bold">
        🚀 CommitGen - AI-Powered Commit Message Generator
      </div>
    ),
    delay: 500,
  },
  {
    type: "output",
    content: (
      <div className="flex flex-col gap-1 my-2">
        <div className="font-bold text-neutral-300">📊 Analysis:</div>
        <div className="pl-4 text-neutral-400">Files changed: 1</div>
        <div className="pl-4 text-emerald-400">Additions: +142</div>
        <div className="pl-4 text-red-400">Deletions: -24</div>
      </div>
    ),
    delay: 800,
  },
  {
    type: "output",
    content: (
      <div className="flex flex-col gap-1 my-2">
        <div className="font-bold text-neutral-300">
          💡 Suggested commit messages:
        </div>
      </div>
    ),
    delay: 1500,
  },
  {
    type: "menu",
    items: [
      "feat: add interactive terminal demo component",
      "style: update landing page hero section",
      "chore: update dependencies",
    ],
    delay: 2000,
  },
];

const TerminalAnimation = ({
  command,
  showInstall,
}: {
  command: string;
  showInstall: boolean;
}) => {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [typing, setTyping] = useState(true);
  const [commandText, setCommandText] = useState("");

  useEffect(() => {
    let mounted = true;

    const runSequence = async () => {
      // 1. Type the command
      for (let i = 0; i <= command.length; i++) {
        if (!mounted) return;
        setCommandText(command.slice(0, i));
        await new Promise((r) => setTimeout(r, 50 + Math.random() * 30));
      }

      await new Promise((r) => setTimeout(r, 500));
      if (!mounted) return;

      setTyping(false);
      setLines((prev) => [...prev, { type: "command", content: command }]);
      setCommandText("");

      // 2. Fake install if needed
      if (showInstall) {
        if (!mounted) return;
        setLines((prev) => [
          ...prev,
          {
            type: "output",
            content: (
              <span className="text-neutral-500">added 1 package in 2s</span>
            ),
          },
        ]);
        await new Promise((r) => setTimeout(r, 800));

        // Type commitgen
        if (!mounted) return;
        setTyping(true);
        const secondCmd = "commitgen";
        for (let i = 0; i <= secondCmd.length; i++) {
          if (!mounted) return;
          setCommandText(secondCmd.slice(0, i));
          await new Promise((r) => setTimeout(r, 50));
        }
        await new Promise((r) => setTimeout(r, 300));
        if (!mounted) return;
        setTyping(false);
        setLines((prev) => [...prev, { type: "command", content: secondCmd }]);
        setCommandText("");
      }

      // 3. Show CLI output sequence
      for (const step of CLI_STEPS) {
        if (!mounted) return;
        await new Promise((r) => setTimeout(r, step.delay || 400));
        if (!mounted) return;
        setLines((prev) => [...prev, step]);
      }
    };

    runSequence();

    return () => {
      mounted = false;
    };
  }, [command, showInstall]);

  return (
    <div className="flex flex-col gap-1">
      {lines.map((line, i) => (
        <div key={i}>
          {line.type === "command" && (
            <div className="flex items-center gap-2 text-neutral-100">
              <span className="text-emerald-500">❯</span>
              <span>{line.content}</span>
            </div>
          )}
          {line.type === "output" && <div className="ml-4">{line.content}</div>}
          {line.type === "menu" && (
            <div className="ml-4 flex flex-col gap-1">
              <div className="text-cyan-400">? Choose a commit message:</div>
              {line.items.map((item: string, idx: number) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded px-2 py-1",
                    idx === 0
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "text-neutral-500"
                  )}
                >
                  <span className="w-4">{idx === 0 ? "❯" : " "}</span>
                  {idx + 1}. {item}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      ))}

      {typing && (
        <div className="flex items-center gap-2 text-neutral-100">
          <span className="text-emerald-500">❯</span>
          <span>{commandText}</span>
          <motion.span
            animate={{ opacity: [0, 1] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="h-4 w-2 bg-neutral-500"
          />
        </div>
      )}
    </div>
  );
};

export const TerminalDemo = () => {
  const [activeTab, setActiveTab] = useState("npx");
  const currentTab = TABS.find((t) => t.id === activeTab) || TABS[0];

  return (
    <div className="w-full max-w-2xl mx-auto overflow-hidden rounded-xl border border-neutral-200 bg-[#0c0c0c] shadow-2xl dark:border-neutral-800">
      {/* Window Header */}
      <div className="flex h-10 items-center justify-between border-b border-neutral-800 bg-[#141414] px-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500/20 md:bg-[#FF5F56]" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/20 md:bg-[#FFBD2E]" />
          <div className="h-3 w-3 rounded-full bg-green-500/20 md:bg-[#27C93F]" />
        </div>
        <div className="flex items-center rounded-lg bg-neutral-900/50 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "rounded px-3 py-1 text-xs font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-neutral-800 text-white"
                  : "text-neutral-500 hover:text-neutral-300"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal Body */}
      <div className="h-[360px] overflow-y-auto p-4 font-mono text-sm leading-relaxed text-neutral-300 scrollbar-none text-left">
        <TerminalAnimation
          key={activeTab}
          command={currentTab.command}
          showInstall={currentTab.showInstall}
        />
      </div>
    </div>
  );
};
