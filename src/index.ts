#!/usr/bin/env node

// ./src/index.ts

import { execSync } from "child_process";
import chalk from "chalk";
import { Command } from "commander";
import inquirer from "inquirer";

interface CommitMessage {
  type: string;
  scope?: string;
  subject: string;
  body?: string;
  breaking?: boolean;
}

interface GitAnalysis {
  filesChanged: string[];
  additions: number;
  deletions: number;
  hasStaged: boolean;
  hasUnstaged: boolean;
  diff: string;
}

class CommitGen {
  private exec(cmd: string): string {
    try {
      return execSync(cmd, {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "ignore"],
      }).trim();
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

  private analyzeChanges(): GitAnalysis {
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
      diff,
    };
  }

  private generateCommitMessage(analysis: GitAnalysis): CommitMessage[] {
    const { filesChanged, additions, deletions, diff } = analysis;
    const suggestions: CommitMessage[] = [];

    // Analyze file patterns
    const hasTests = filesChanged.some(
      (f) =>
        f.includes("test") || f.includes("spec") || f.includes("__tests__"),
    );
    const hasDocs = filesChanged.some(
      (f) =>
        f.includes("README") ||
        f.includes(".md") ||
        f.toLowerCase().includes("doc"),
    );
    const hasConfig = filesChanged.some(
      (f) =>
        f.includes("config") ||
        f.includes(".json") ||
        f.includes(".yml") ||
        f.includes(".yaml") ||
        f.includes(".toml") ||
        f.includes("package.json") ||
        f.includes("tsconfig"),
    );
    const hasStyles = filesChanged.some(
      (f) =>
        f.includes(".css") ||
        f.includes(".scss") ||
        f.includes(".sass") ||
        f.includes(".less"),
    );
    const hasComponents = filesChanged.some(
      (f) =>
        f.includes("component") ||
        f.includes(".tsx") ||
        f.includes(".jsx") ||
        f.includes("Component"),
    );
    const hasDependencies = filesChanged.some(
      (f) =>
        f.includes("package.json") ||
        f.includes("package-lock.json") ||
        f.includes("yarn.lock"),
    );
    const hasCI = filesChanged.some(
      (f) =>
        f.includes(".github") ||
        f.includes("gitlab-ci") ||
        f.includes("Jenkinsfile"),
    );
    const hasBuild = filesChanged.some(
      (f) =>
        f.includes("webpack") ||
        f.includes("vite") ||
        f.includes("rollup") ||
        f.includes("build"),
    );

    // Check for breaking changes
    const hasBreaking =
      diff.toLowerCase().includes("breaking change") ||
      diff.includes("BREAKING CHANGE");

    // Generate contextual suggestions
    if (additions > deletions * 2 && additions > 20) {
      suggestions.push({
        type: "feat",
        subject: `add ${this.inferFeatureType(filesChanged)}`,
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

    if (hasConfig && !hasDependencies) {
      suggestions.push({
        type: "chore",
        subject: "update configuration",
      });
    }

    if (hasDependencies) {
      suggestions.push({
        type: "chore",
        subject: "update dependencies",
      });
    }

    if (hasStyles) {
      suggestions.push({
        type: "style",
        subject: `update ${this.inferScope(filesChanged)} styling`,
      });
    }

    if (hasComponents) {
      suggestions.push({
        type: "feat",
        subject: `update ${this.inferScope(filesChanged)} component`,
      });
    }

    if (hasCI) {
      suggestions.push({
        type: "ci",
        subject: "update CI/CD configuration",
      });
    }

    if (hasBuild) {
      suggestions.push({
        type: "build",
        subject: "update build configuration",
      });
    }

    // Default suggestions
    if (suggestions.length === 0) {
      const scope = this.inferScope(filesChanged);
      suggestions.push(
        {
          type: "feat",
          subject: `add ${this.inferFeatureType(filesChanged)}`,
          scope:
            scope !== "project" && scope !== "multiple modules"
              ? scope
              : undefined,
        },
        {
          type: "fix",
          subject: `resolve issue in ${scope}`,
        },
        {
          type: "refactor",
          subject: `improve ${scope}`,
        },
      );
    }

    // Mark breaking if detected
    if (hasBreaking) {
      suggestions.forEach((s) => (s.breaking = true));
    }

    return suggestions.slice(0, 5);
  }

  private inferFeatureType(files: string[]): string {
    if (files.some((f) => f.includes("component") || f.includes("Component")))
      return "component";
    if (files.some((f) => f.includes("util") || f.includes("helper")))
      return "utility";
    if (files.some((f) => f.includes("api") || f.includes("endpoint")))
      return "API endpoint";
    if (files.some((f) => f.includes("model") || f.includes("schema")))
      return "model";
    if (files.some((f) => f.includes("service"))) return "service";
    if (files.some((f) => f.includes("hook"))) return "hook";
    if (files.some((f) => f.includes("type") || f.includes("interface")))
      return "types";
    return "feature";
  }

  private inferScope(files: string[]): string {
    if (files.length === 0) return "project";

    // Extract first directory from each file
    const dirs = files
      .map((f) => f.split("/")[0])
      .filter((d) => d && !d.startsWith("."));

    if (dirs.length === 0) return "root";

    // Find most common directory
    const dirCount = dirs.reduce(
      (acc, d) => {
        acc[d] = (acc[d] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const mostCommon = Object.entries(dirCount).sort(
      (a, b) => b[1] - a[1],
    )[0][0];

    // If most common directory covers most files, use it
    if (dirCount[mostCommon] >= files.length * 0.6) {
      return mostCommon;
    }

    return "multiple modules";
  }

  private formatCommitMessage(msg: CommitMessage): string {
    let result = `${msg.type}`;
    if (msg.scope) result += `(${msg.scope})`;
    if (msg.breaking) result += "!";
    result += `: ${msg.subject}`;
    if (msg.body) result += `\n\n${msg.body}`;
    if (msg.breaking)
      result += `\n\nBREAKING CHANGE: Major version update required`;
    return result;
  }

  private displayAnalysis(analysis: GitAnalysis): void {
    console.log(chalk.cyan.bold("\n📊 Analysis:"));
    console.log(
      chalk.gray(
        `   Files changed: ${chalk.white(analysis.filesChanged.length)}`,
      ),
    );
    console.log(
      chalk.gray(`   Additions: ${chalk.green(`+${analysis.additions}`)}`),
    );
    console.log(
      chalk.gray(`   Deletions: ${chalk.red(`-${analysis.deletions}`)}`),
    );

    console.log(chalk.cyan.bold("\n📝 Changed files:"));
    analysis.filesChanged.slice(0, 10).forEach((f) => {
      const ext = f.split(".").pop();
      const icon = this.getFileIcon(ext || "");
      console.log(chalk.gray(`   ${icon} ${f}`));
    });

    if (analysis.filesChanged.length > 10) {
      console.log(
        chalk.gray(
          `   ... and ${analysis.filesChanged.length - 10} more files`,
        ),
      );
    }
  }

  private getFileIcon(ext: string): string {
    const icons: Record<string, string> = {
      ts: "📘",
      js: "📒",
      tsx: "⚛️",
      jsx: "⚛️",
      json: "📋",
      md: "📝",
      css: "🎨",
      scss: "🎨",
      html: "🌐",
      test: "🧪",
      spec: "🧪",
    };
    return icons[ext] || "📄";
  }

  async run(options: { push?: boolean; noverify?: boolean }): Promise<void> {
    console.log(
      chalk.bold.cyan("\n🚀 CommitGen") +
        chalk.gray(" - AI-Powered Commit Message Generator\n"),
    );

    if (!this.isGitRepo()) {
      console.error(chalk.red("❌ Error: Not a git repository"));
      process.exit(1);
    }

    const analysis = this.analyzeChanges();

    if (!analysis.hasStaged) {
      console.log(chalk.yellow("⚠️  No staged changes found."));
      if (analysis.hasUnstaged) {
        console.log(
          chalk.blue("💡 You have unstaged changes. Stage them with:") +
            chalk.gray(" git add <files>"),
        );
      }
      process.exit(0);
    }

    this.displayAnalysis(analysis);

    const suggestions = this.generateCommitMessage(analysis);

    console.log(chalk.cyan.bold("\n💡 Suggested commit messages:\n"));

    const choices = suggestions.map((s, i) => {
      const formatted = this.formatCommitMessage(s);
      const preview = formatted.split("\n")[0]; // First line only
      return {
        name: `${chalk.gray(`${i + 1}.`)} ${preview}`,
        value: formatted,
        short: preview,
      };
    });

    choices.push({
      name: chalk.gray("✏️  Write custom message"),
      value: "__custom__",
      short: "Custom message",
    });

    const { selected } = await inquirer.prompt([
      {
        type: "list",
        name: "selected",
        message: "Choose a commit message:",
        choices,
        pageSize: 10,
      },
    ]);

    let commitMessage: string;

    if (selected === "__custom__") {
      const { customMessage } = await inquirer.prompt([
        {
          type: "input",
          name: "customMessage",
          message: "Enter your commit message:",
          validate: (input: string) => {
            if (!input.trim()) return "Commit message cannot be empty";
            return true;
          },
        },
      ]);
      commitMessage = customMessage;
    } else {
      const { confirmed } = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirmed",
          message: "Confirm this commit message?",
          default: true,
        },
      ]);

      if (!confirmed) {
        const { customMessage } = await inquirer.prompt([
          {
            type: "input",
            name: "customMessage",
            message: "Enter your commit message:",
            validate: (input: string) => {
              if (!input.trim()) return "Commit message cannot be empty";
              return true;
            },
          },
        ]);
        commitMessage = customMessage;
      } else {
        commitMessage = selected;
      }
    }

    if (!commitMessage.trim()) {
      console.log(chalk.red("\n❌ Commit cancelled - empty message"));
      return;
    }

    try {
      let commitCmd = `git commit -m "${commitMessage.replace(/"/g, '\\"')}"`;

      if (options.noverify) {
        commitCmd += " --no-verify";
      }

      this.exec(commitCmd);
      console.log(chalk.green("\n✅ Commit successful!"));

      if (options.push) {
        console.log(chalk.blue("\n📤 Pushing to remote..."));
        const currentBranch = this.exec("git branch --show-current");
        this.exec(`git push origin ${currentBranch}`);
        console.log(chalk.green("✅ Pushed successfully!"));
      }
    } catch (error) {
      console.error(chalk.red("❌ Commit failed:"), error);
      process.exit(1);
    }
  }
}

// CLI setup
const program = new Command();

program
  .name("commitgen")
  .description("AI-powered commit message generator for Git")
  .version("0.0.3")
  .option("-p, --push", "Push changes after committing")
  .option("-n, --noverify", "Skip git hooks (--no-verify)")
  .action(async (options) => {
    const commitGen = new CommitGen();
    await commitGen.run(options);
  });

program.parse();
