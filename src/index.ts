#!/usr/bin/env node

import { execSync } from "child_process";
import * as readline from "readline";

interface CommitMessage {
  type: string;
  scope?: string;
  subject: string;
  body?: string;
}

class CommitGen {
  private rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  private exec(cmd: string): string {
    try {
      return execSync(cmd, { encoding: "utf8" }).trim();
    } catch (error) {
      return "";
    }
  }

  private isGitRepo(): boolean {
    return this.exec("git rev-parse --git-dir") !== "";
  }

  private getStagedChanges(): string {
    return this.exec("git diff --cached --stat");
  }

  private getStagedDiff(): string {
    return this.exec("git diff --cached");
  }

  private getTrackedChanges(): string {
    return this.exec("git diff --stat");
  }

  private analyzeChanges(): {
    filesChanged: string[];
    additions: number;
    deletions: number;
    hasStaged: boolean;
    hasUnstaged: boolean;
  } {
    const staged = this.getStagedChanges();
    const unstaged = this.getTrackedChanges();
    const diff = this.getStagedDiff();

    const files: string[] = [];
    if (staged) {
      const lines = staged.split("\n");
      lines.forEach((line) => {
        const match = line.match(/^\s*(.+?)\s+\|/);
        if (match) files.push(match[1]);
      });
    }

    const additions = (diff.match(/^\+(?!\+)/gm) || []).length;
    const deletions = (diff.match(/^-(?!-)/gm) || []).length;

    return {
      filesChanged: files,
      additions,
      deletions,
      hasStaged: staged !== "",
      hasUnstaged: unstaged !== "",
    };
  }

  private generateCommitMessage(
    analysis: ReturnType<typeof this.analyzeChanges>,
  ): CommitMessage[] {
    const { filesChanged, additions, deletions } = analysis;

    const suggestions: CommitMessage[] = [];

    // Analyze file patterns
    const hasTests = filesChanged.some(
      (f) => f.includes("test") || f.includes("spec"),
    );
    const hasDocs = filesChanged.some(
      (f) => f.includes("README") || f.includes(".md"),
    );
    const hasConfig = filesChanged.some(
      (f) =>
        f.includes("config") ||
        f.includes(".json") ||
        f.includes(".yml") ||
        f.includes(".yaml"),
    );
    const hasStyles = filesChanged.some(
      (f) => f.includes(".css") || f.includes(".scss"),
    );
    const hasComponents = filesChanged.some(
      (f) =>
        f.includes("component") || f.includes(".tsx") || f.includes(".jsx"),
    );

    // Generate contextual suggestions
    if (additions > deletions * 2 && additions > 20) {
      suggestions.push({
        type: "feat",
        subject: `add new ${this.inferFeatureType(filesChanged)}`,
        body: `Added ${filesChanged.length} file(s) with ${additions} lines`,
      });
    }

    if (deletions > additions * 2 && deletions > 20) {
      suggestions.push({
        type: "refactor",
        subject: `remove unused ${this.inferFeatureType(filesChanged)}`,
        body: `Removed ${deletions} lines from ${filesChanged.length} file(s)`,
      });
    }

    if (hasTests) {
      suggestions.push({
        type: "test",
        subject: `add tests for ${this.inferScope(filesChanged)}`,
      });
    }

    if (hasDocs) {
      suggestions.push({
        type: "docs",
        subject: "update documentation",
      });
    }

    if (hasConfig) {
      suggestions.push({
        type: "chore",
        subject: "update configuration",
      });
    }

    if (hasStyles) {
      suggestions.push({
        type: "style",
        subject: "update styling",
      });
    }

    if (hasComponents) {
      suggestions.push({
        type: "feat",
        subject: `update ${this.inferScope(filesChanged)} component`,
      });
    }

    // Default suggestions
    if (suggestions.length === 0) {
      suggestions.push(
        {
          type: "feat",
          subject: `add ${this.inferFeatureType(filesChanged)}`,
        },
        {
          type: "fix",
          subject: `resolve issue in ${this.inferScope(filesChanged)}`,
        },
        {
          type: "refactor",
          subject: `improve ${this.inferScope(filesChanged)}`,
        },
      );
    }

    return suggestions.slice(0, 5);
  }

  private inferFeatureType(files: string[]): string {
    if (files.some((f) => f.includes("component"))) return "component";
    if (files.some((f) => f.includes("util"))) return "utility";
    if (files.some((f) => f.includes("api"))) return "API endpoint";
    if (files.some((f) => f.includes("model"))) return "model";
    if (files.some((f) => f.includes("service"))) return "service";
    return "feature";
  }

  private inferScope(files: string[]): string {
    if (files.length === 0) return "project";

    const commonPath = files[0].split("/")[0];
    if (files.every((f) => f.startsWith(commonPath))) {
      return commonPath;
    }

    return "multiple modules";
  }

  private formatCommitMessage(msg: CommitMessage): string {
    let result = `${msg.type}`;
    if (msg.scope) result += `(${msg.scope})`;
    result += `: ${msg.subject}`;
    if (msg.body) result += `\n\n${msg.body}`;
    return result;
  }

  private question(query: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(query, resolve);
    });
  }

  private async selectFromOptions(options: string[]): Promise<number> {
    options.forEach((opt, i) => {
      console.log(`${i + 1}. ${opt}`);
    });

    const answer = await this.question(
      "\nSelect option (number) or press Enter for #1: ",
    );
    const num = parseInt(answer) || 1;
    return Math.min(Math.max(1, num), options.length) - 1;
  }

  async run(): Promise<void> {
    console.log("🚀 CommitGen - AI-Powered Commit Message Generator\n");

    if (!this.isGitRepo()) {
      console.error("❌ Error: Not a git repository");
      process.exit(1);
    }

    const analysis = this.analyzeChanges();

    if (!analysis.hasStaged) {
      console.log("⚠️  No staged changes found.");
      if (analysis.hasUnstaged) {
        console.log(
          "💡 You have unstaged changes. Stage them with: git add <files>",
        );
      }
      process.exit(0);
    }

    console.log(`📊 Analysis:`);
    console.log(`   Files changed: ${analysis.filesChanged.length}`);
    console.log(`   Additions: +${analysis.additions}`);
    console.log(`   Deletions: -${analysis.deletions}`);
    console.log(`\n📝 Changed files:`);
    analysis.filesChanged.forEach((f) => console.log(`   - ${f}`));

    const suggestions = this.generateCommitMessage(analysis);

    console.log("\n💡 Suggested commit messages:\n");
    const options = suggestions.map((s) => this.formatCommitMessage(s));
    options.push("✏️  Write custom message");

    const selected = await this.selectFromOptions(options);

    let commitMessage: string;

    if (selected === options.length - 1) {
      commitMessage = await this.question("\nEnter your commit message: ");
    } else {
      commitMessage = options[selected];
      const confirm = await this.question(`\nUse this message? (Y/n): `);
      if (confirm.toLowerCase() === "n") {
        commitMessage = await this.question("Enter your commit message: ");
      }
    }

    if (!commitMessage.trim()) {
      console.log("❌ Commit cancelled - empty message");
      this.rl.close();
      return;
    }

    try {
      this.exec(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`);
      console.log("\n✅ Commit successful!");
    } catch (error) {
      console.error("❌ Commit failed:", error);
    }

    this.rl.close();
  }
}

const commitGen = new CommitGen();
commitGen.run().catch(console.error);
