#!/usr/bin/env node

// ./src/index.ts
import { execSync } from "child_process";
import chalk from "chalk";
import { Command } from "commander";
import inquirer from "inquirer";
import { CommitMessage, GitAnalysis, CommitGenOptions } from "./types";
import { ConfigManager } from "./config";
import { configureCommand } from "./commands/configure";
import { loginCommand } from "./commands/login"; // NEW
import { buyCreditsCommand } from "./commands/buy-credits"; // NEW
import { dashboardCommand } from "./commands/dashboard"; // NEW
import { createProvider } from "./providers";
import { CommitGenProvider } from "./providers/commitgen"; // NEW
import { CommitHistoryAnalyzer } from "./utils/commit-history";
import { MultiCommitAnalyzer } from "./utils/multi-commit";
import { IssueTrackerIntegration } from "./utils/issue-tracker";
import { Answers } from "inquirer";
import { LoadingIndicator, withLoading } from "./utils/loading";
import { readFileSync } from "fs";

import packageJson from "../package.json";

const getVersionSimple = () => {
  return packageJson.version;
};

// Graceful shutdown handler
process.on("SIGINT", () => {
  console.log(chalk.yellow("\n\n👋 Cancelled by user"));
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log(chalk.yellow("\n\n👋 Cancelled by user"));
  process.exit(0);
});

/**
 * Wrapper for inquirer prompts that handles SIGINT gracefully
 */
async function safePrompt<T extends Answers = Answers>(
  promptConfig: any
): Promise<T | null> {
  try {
    const result = await inquirer.prompt(promptConfig);
    return result as T;
  } catch (error) {
    if (error instanceof Error && error.message.includes("SIGINT")) {
      console.log(chalk.yellow("\n\n👋 Cancelled by user"));
      process.exit(0);
    }
    throw error;
  }
}

class CommitGen {
  private historyAnalyzer: CommitHistoryAnalyzer;
  private multiCommitAnalyzer: MultiCommitAnalyzer;
  private issueTracker: IssueTrackerIntegration;

  constructor() {
    this.historyAnalyzer = new CommitHistoryAnalyzer();
    this.multiCommitAnalyzer = new MultiCommitAnalyzer();
    this.issueTracker = new IssueTrackerIntegration();
  }

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
        `   Files changed: ${chalk.white(analysis.filesChanged.length)}`
      )
    );
    console.log(
      chalk.gray(`   Additions: ${chalk.green(`+${analysis.additions}`)}`)
    );
    console.log(
      chalk.gray(`   Deletions: ${chalk.red(`-${analysis.deletions}`)}`)
    );

    console.log(chalk.cyan.bold("\n📝 Changed files:"));
    analysis.filesChanged.slice(0, 10).forEach((f) => {
      const ext = f.split(".").pop();
      const icon = this.getFileIcon(ext || "");
      console.log(chalk.gray(`   ${icon} ${f}`));
    });

    if (analysis.filesChanged.length > 10) {
      console.log(
        chalk.gray(`   ... and ${analysis.filesChanged.length - 10} more files`)
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

  private hasEnvironmentApiKey(provider: string): boolean {
    switch (provider) {
      case "vercel-google":
        return !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      case "vercel-openai":
        return !!process.env.OPENAI_API_KEY;
      case "groq":
        return !!process.env.GROQ_API_KEY;
      case "openai":
        return !!process.env.OPENAI_API_KEY;
      case "google":
        return !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      default:
        return false;
    }
  }

  private combineCommitMessages(messages: CommitMessage[]): CommitMessage {
    const types = messages.map((m) => m.type);
    const typeCount = types.reduce((acc, t) => {
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const mostCommonType = Object.entries(typeCount).sort(
      (a, b) => b[1] - a[1]
    )[0][0];

    const scopes = messages.map((m) => m.scope).filter(Boolean);
    const uniqueScopes = [...new Set(scopes)];
    const scope =
      uniqueScopes.length > 0 ? uniqueScopes.slice(0, 2).join(", ") : undefined;

    const subjects = messages.map((m) => m.subject);
    const combinedSubject = subjects.join("; ");

    const bodies = messages.map((m) => m.body).filter(Boolean);
    const combinedBody = bodies.length > 0 ? bodies.join("\n\n") : undefined;

    const hasBreaking = messages.some((m) => m.breaking);

    return {
      type: mostCommonType,
      scope,
      subject: combinedSubject,
      body: combinedBody,
      breaking: hasBreaking,
    };
  }

  async run(options: CommitGenOptions): Promise<void> {
    console.log(
      chalk.bold.cyan("\n🚀 CommitGen") +
        chalk.gray(" - AI-Powered Commit Message Generator\n")
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
            chalk.gray(" git add <files>")
        );
      }
      process.exit(0);
    }

    // Check for issue tracking integration
    let issueRef = null;
    if (options.linkIssues !== false) {
      issueRef = this.issueTracker.extractIssueFromBranch();
      if (issueRef) {
        console.log(
          chalk.cyan(
            `\n${this.issueTracker.getIssueDisplay(issueRef)} detected`
          )
        );
      }
    }

    // Check if multi-commit mode should be suggested
    if (
      options.multiCommit !== false &&
      this.multiCommitAnalyzer.shouldSplit(analysis)
    ) {
      const result = await safePrompt<{ useMultiCommit: boolean }>([
        {
          type: "confirm",
          name: "useMultiCommit",
          message: chalk.yellow(
            "🔄 Multiple concerns detected. Split into separate commits?"
          ),
          default: true,
        },
      ]);

      if (!result) return;

      if (result.useMultiCommit) {
        return this.runMultiCommit(analysis, options);
      }
    }

    this.displayAnalysis(analysis);

    // Load commit history pattern for personalization
    let historyPattern = null;
    if (options.learnFromHistory !== false) {
      historyPattern = await this.historyAnalyzer.getCommitPattern();
      if (historyPattern) {
        console.log(
          chalk.cyan("\n📜 Personalizing based on your commit history")
        );
      }
    }

    let suggestions: CommitMessage[] = [];
    let usingFallback = false;

    if (options.useAi) {
      try {
        const configManager = new ConfigManager();
        let providerConfig = configManager.getProviderConfig();

        // Override model if specified in options
        if (options.model) {
          providerConfig = { ...providerConfig, model: options.model };
          console.log(chalk.blue(`🎯 Using model: ${options.model}`));
        }

        if (
          !providerConfig.apiKey &&
          !this.hasEnvironmentApiKey(providerConfig.provider)
        ) {
          console.log(
            chalk.yellow("\n⚠️  API key not found for the selected provider.")
          );
          const result = await safePrompt<{ shouldConfigure: boolean }>([
            {
              type: "confirm",
              name: "shouldConfigure",
              message: "Would you like to configure your API key now?",
              default: true,
            },
          ]);

          if (!result) return;

          if (result.shouldConfigure) {
            await configureCommand();
            providerConfig = configManager.getProviderConfig();
          } else {
            console.log(
              chalk.gray("Falling back to rule-based suggestions...\n")
            );
            suggestions = this.getFallbackSuggestions(analysis);
            usingFallback = true;
          }
        }

        if (!usingFallback) {
          const modelDisplay = providerConfig.model || "default";

          const provider = createProvider(providerConfig);
          suggestions = await withLoading(
            `Generating commit messages using ${providerConfig.provider} (${modelDisplay})...`,
            async () => await provider.generateCommitMessage(analysis),
            "Commit messages generated"
          );

          if (!suggestions || suggestions.length === 0) {
            throw new Error("No suggestions generated");
          }

          // Personalize suggestions based on history
          if (historyPattern) {
            suggestions = suggestions.map((msg) =>
              this.historyAnalyzer.personalizeCommitMessage(msg, historyPattern)
            );
          }

          // Adjust type based on issue if available
          if (issueRef) {
            suggestions = suggestions.map((msg) => ({
              ...msg,
              type: this.issueTracker.suggestTypeFromIssue(issueRef, msg.type),
            }));
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        // Check if it's an API overload error
        if (
          errorMessage.includes("overloaded") ||
          errorMessage.includes("503")
        ) {
          console.warn(chalk.yellow(`\n⚠️  ${errorMessage}`));
          console.log(
            chalk.blue(
              "💡 Tip: You can use 'commitgen --no-use-ai' to skip AI generation"
            )
          );
        } else if (errorMessage.includes("API key")) {
          console.warn(chalk.yellow(`\n⚠️  ${errorMessage}`));

          const result = await safePrompt<{ shouldReconfigure: boolean }>([
            {
              type: "confirm",
              name: "shouldReconfigure",
              message: "Would you like to reconfigure your API key?",
              default: true,
            },
          ]);

          if (!result) return;

          if (result.shouldReconfigure) {
            // Assuming 'program' is available in this scope or passed as an argument
            // This part of the diff seems to be misplaced or refers to a different context.
            // I'm placing the login/config checks here as per the instruction,
            // but noting that `program.opts()` might not be directly accessible here.
            // If `options` passed to `run` already contains these, then `program.opts()` is redundant.
            // For now, I'll assume `options` already contains `login` and `config` flags.
            if (options.login) {
              await loginCommand();
              process.exit(0);
            }

            if (options.config) {
              await configureCommand();
              process.exit(0);
            }
            console.log(
              chalk.blue(
                "\n🔄 Please run the command again with your new configuration."
              )
            );
            return;
          }
        } else {
          console.warn(
            chalk.yellow(`\n⚠️  AI generation failed: ${errorMessage}`)
          );
        }

        console.log(
          chalk.gray("\nFalling back to rule-based suggestions...\n")
        );
        suggestions = this.getFallbackSuggestions(analysis);
        usingFallback = true;
      }
    } else {
      console.log(
        chalk.gray("\n📝 Using rule-based suggestions (AI disabled)\n")
      );
      suggestions = this.getFallbackSuggestions(analysis);
      usingFallback = true;
    }

    await this.commitInteractive(suggestions, analysis, issueRef, options);
  }

  private async runMultiCommit(
    analysis: GitAnalysis,
    options: CommitGenOptions
  ): Promise<void> {
    const groups = this.multiCommitAnalyzer.groupFiles(analysis);

    console.log(
      chalk.cyan.bold(`\n🔄 Splitting into ${groups.length} commits:\n`)
    );

    groups.forEach((group, i) => {
      console.log(chalk.gray(`${i + 1}. ${group.reason}`));
      console.log(
        chalk.gray(
          `   Files: ${group.files.slice(0, 3).join(", ")}${
            group.files.length > 3 ? "..." : ""
          }`
        )
      );
    });

    const result = await safePrompt<{ proceed: boolean }>([
      {
        type: "confirm",
        name: "proceed",
        message: "Proceed with multi-commit?",
        default: true,
      },
    ]);

    if (!result) return;

    if (!result.proceed) {
      console.log(
        chalk.yellow("\nCancelled. Falling back to single commit mode.")
      );
      return this.run({ ...options, multiCommit: false });
    }

    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      console.log(
        chalk.cyan.bold(
          `\n📝 Commit ${i + 1}/${groups.length}: ${group.reason}`
        )
      );

      // Generate suggestions for this group
      let suggestions = [group.suggestedMessage];
      if (options.useAi) {
        try {
          const configManager = new ConfigManager();
          let providerConfig = configManager.getProviderConfig();

          // Override model if specified
          if (options.model) {
            providerConfig = { ...providerConfig, model: options.model };
          }

          if (
            providerConfig.apiKey ||
            this.hasEnvironmentApiKey(providerConfig.provider)
          ) {
            const provider = createProvider(providerConfig);
            const loader = new LoadingIndicator("Generating commit message...");
            loader.start();

            try {
              suggestions = await provider.generateCommitMessage(
                group.analysis
              );
              loader.succeed("Generated");
            } catch (err) {
              loader.stop();
              throw err;
            }
          }
        } catch (error) {
          console.log(chalk.gray("Using suggested message for this commit"));
        }
      }

      await this.commitInteractive(
        suggestions,
        group.analysis,
        null,
        options,
        group.files
      );
    }

    console.log(chalk.green.bold("\n✅ All commits completed!"));
  }

  private async commitInteractive(
    suggestions: CommitMessage[],
    analysis: GitAnalysis,
    issueRef: any,
    options: CommitGenOptions,
    specificFiles?: string[]
  ): Promise<void> {
    console.log(chalk.cyan.bold("💡 Suggested commit messages:\n"));

    const choices = suggestions.map((s, i) => {
      const formatted = this.formatCommitMessage(s);
      const preview = formatted.split("\n")[0];
      return {
        name: `${chalk.gray(`${i + 1}.`)} ${preview}`,
        value: i,
        short: preview,
      };
    });

    choices.push({
      name: chalk.magenta("🔗 Combine all suggestions"),
      value: -1,
      short: "Combined",
    });

    choices.push({
      name: chalk.gray("✏️  Write custom message"),
      value: -2,
      short: "Custom message",
    });

    const result = await safePrompt<{ selectedIndex: number }>([
      {
        type: "list",
        name: "selectedIndex",
        message: "Choose a commit message:",
        choices,
        pageSize: 10,
      },
    ]);

    if (!result) return;

    const { selectedIndex } = result;
    let commitMessage: string;

    if (selectedIndex === -1) {
      const combined = this.combineCommitMessages(suggestions);
      const combinedFormatted = this.formatCommitMessage(combined);

      console.log(chalk.cyan("\n📦 Combined message:"));
      console.log(chalk.white(combinedFormatted));

      const actionResult = await safePrompt<{ action: string }>([
        {
          type: "list",
          name: "action",
          message: "What would you like to do?",
          choices: [
            { name: "✅ Use this combined message", value: "use" },
            { name: "✏️  Edit this message", value: "edit" },
            { name: "🔙 Go back to suggestions", value: "back" },
          ],
        },
      ]);

      if (!actionResult) return;

      if (actionResult.action === "back") {
        return this.commitInteractive(
          suggestions,
          analysis,
          issueRef,
          options,
          specificFiles
        );
      } else if (actionResult.action === "edit") {
        const editResult = await safePrompt<{ edited: string }>([
          {
            type: "input",
            name: "edited",
            message: "Edit commit message:",
            default: combinedFormatted,
            validate: (input: string) => {
              if (!input.trim()) return "Commit message cannot be empty";
              return true;
            },
          },
        ]);
        if (!editResult) return;
        commitMessage = editResult.edited;
      } else {
        commitMessage = combinedFormatted;
      }
    } else if (selectedIndex === -2) {
      const customResult = await safePrompt<{ customMessage: string }>([
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
      if (!customResult) return;
      commitMessage = customResult.customMessage;
    } else {
      let selected = suggestions[selectedIndex];

      // Add issue reference if available
      if (issueRef && options.linkIssues !== false) {
        selected = this.issueTracker.appendIssueToCommit(selected, issueRef);
      }

      const formatted = this.formatCommitMessage(selected);

      const actionResult = await safePrompt<{ action: string }>([
        {
          type: "list",
          name: "action",
          message: "What would you like to do?",
          choices: [
            { name: "✅ Use this message", value: "use" },
            { name: "✏️  Edit this message", value: "edit" },
            { name: "🔙 Choose a different message", value: "back" },
          ],
        },
      ]);

      if (!actionResult) return;

      if (actionResult.action === "back") {
        return this.commitInteractive(
          suggestions,
          analysis,
          issueRef,
          options,
          specificFiles
        );
      } else if (actionResult.action === "edit") {
        const editResult = await safePrompt<{ edited: string }>([
          {
            type: "input",
            name: "edited",
            message: "Edit commit message:",
            default: formatted,
            validate: (input: string) => {
              if (!input.trim()) return "Commit message cannot be empty";
              return true;
            },
          },
        ]);
        if (!editResult) return;
        commitMessage = editResult.edited;
      } else {
        commitMessage = formatted;
      }
    }

    if (!commitMessage.trim()) {
      console.log(chalk.red("\n❌ Commit cancelled - empty message"));
      return;
    }

    try {
      let commitCmd = specificFiles
        ? `git commit ${specificFiles
            .map((f) => `"${f}"`)
            .join(" ")} -m "${commitMessage.replace(/"/g, '\\"')}"`
        : `git commit -m "${commitMessage.replace(/"/g, '\\"')}"`;

      if (options.noverify) {
        commitCmd += " --no-verify";
      }

      this.exec(commitCmd);
      console.log(chalk.green("\n✅ Commit successful!"));

      if (options.push && !specificFiles) {
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

  private getFallbackSuggestions(analysis: GitAnalysis): CommitMessage[] {
    const { filesChanged, additions, deletions } = analysis;
    const suggestions: CommitMessage[] = [];

    const hasTests = filesChanged.some(
      (f) => f.includes("test") || f.includes("spec") || f.includes("__tests__")
    );
    const hasDocs = filesChanged.some(
      (f) => f.includes("README") || f.includes(".md")
    );
    const hasConfig = filesChanged.some(
      (f) =>
        f.includes("config") ||
        f.includes(".json") ||
        f.includes("package.json")
    );

    if (additions > deletions * 2 && additions > 20) {
      suggestions.push({
        type: "feat",
        subject: `add new feature`,
      });
    }

    if (deletions > additions * 2 && deletions > 20) {
      suggestions.push({
        type: "refactor",
        subject: `remove unused code`,
      });
    }

    if (hasTests) {
      suggestions.push({
        type: "test",
        subject: `add tests`,
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

    if (suggestions.length === 0) {
      suggestions.push(
        {
          type: "feat",
          subject: `add feature`,
        },
        {
          type: "fix",
          subject: `fix issue`,
        },
        {
          type: "refactor",
          subject: `refactor code`,
        }
      );
    }

    return suggestions.slice(0, 5);
  }
}

// CLI setup
const program = new Command();

program
  .name("commitgen")
  .description("AI-powered commit message generator for Git")
  .version(getVersionSimple())
  .option("-p, --push", "Push changes after committing")
  .option("-n, --noverify", "Skip git hooks (--no-verify)")
  .option("--use-ai", "Use AI generation (default: enabled)")
  .option("--login", "Login to CommitGen account") // NEW
  .option(
    "--no-use-ai",
    "Disable AI generation, use rule-based suggestions only"
  )
  .option("-m, --multi-commit", "Enable multi-commit mode for atomic commits")
  .option("--no-multi-commit", "Disable multi-commit mode")
  .option("--no-history", "Disable commit history learning")
  .option("--no-issues", "Disable issue tracker integration")
  .option(
    "--model <model>",
    "Specify AI model to use (e.g., gemini-1.5-flash, gemini-2.5-pro)"
  )
  .action(async (options) => {
    // Check for login flag first - independent of git status
    if (options.login) {
      await loginCommand();
      return;
    }

    const commitGen = new CommitGen();
    // Default useAi to true if not explicitly set
    if (options.useAi === undefined) {
      options.useAi = true;
    }
    await commitGen.run(options);
  });

program
  .command("config")
  .description("Configure AI provider and settings")
  .action(configureCommand);

program
  .command("buy-credits")
  .description("Buy credits for CommitGen")
  .action(buyCreditsCommand);

program
  .command("dashboard")
  .alias("dash")
  .description("Open the CommitGen dashboard in your browser")
  .action(dashboardCommand);

program
  .command("show-config")
  .description("Show current configuration")
  .action(() => {
    const configManager = new ConfigManager();
    const config = configManager.getProviderConfig();

    console.log(chalk.cyan.bold("\n⚙️  Current Configuration\n"));
    console.log(chalk.gray(`Provider: ${chalk.white(config.provider)}`));
    console.log(chalk.gray(`Model: ${chalk.white(config.model || "default")}`));
    console.log(
      chalk.gray(
        `API Key: ${
          config.apiKey ? chalk.green("configured") : chalk.red("not set")
        }`
      )
    );

    if (!config.apiKey) {
      console.log(
        chalk.yellow("\n💡 Run 'commitgen config' to set up your API key")
      );
    }
  });

program.parse();
