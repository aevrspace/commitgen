// ./src/utils/multi-commit.ts

import { execSync } from "child_process";
import { CommitMessage, GitAnalysis } from "../types";

export interface CommitGroup {
  files: string[];
  analysis: GitAnalysis;
  suggestedMessage: CommitMessage;
  reason: string;
}

export class MultiCommitAnalyzer {
  private exec(cmd: string): string {
    try {
      return execSync(cmd, {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "ignore"],
      }).trim();
    } catch {
      return "";
    }
  }

  /**
   * Analyze if changes should be split into multiple commits
   */
  shouldSplit(analysis: GitAnalysis): boolean {
    const { filesChanged } = analysis;

    // Don't split if only a few files
    if (filesChanged.length < 4) return false;

    // Check for mixed concerns
    const concerns = this.identifyConcerns(filesChanged);

    // Split if we have 2+ distinct concerns
    return concerns.size >= 2;
  }

  /**
   * Identify distinct concerns in changed files
   */
  private identifyConcerns(files: string[]): Set<string> {
    const concerns = new Set<string>();

    for (const file of files) {
      if (
        file.includes("test") ||
        file.includes("spec") ||
        file.includes("__tests__")
      ) {
        concerns.add("tests");
      } else if (file.includes("README") || file.endsWith(".md")) {
        concerns.add("docs");
      } else if (
        file.includes("package.json") ||
        file.includes("tsconfig") ||
        file.includes(".config")
      ) {
        concerns.add("config");
      } else if (file.includes("component") || file.includes("Component")) {
        concerns.add("components");
      } else if (file.includes("util") || file.includes("helper")) {
        concerns.add("utils");
      } else if (file.includes("api") || file.includes("endpoint")) {
        concerns.add("api");
      } else if (
        file.includes("style") ||
        file.endsWith(".css") ||
        file.endsWith(".scss")
      ) {
        concerns.add("styles");
      } else if (file.includes("type") || file.includes("interface")) {
        concerns.add("types");
      } else {
        concerns.add("feature");
      }
    }

    return concerns;
  }

  /**
   * Group files into logical commits
   */
  groupFiles(analysis: GitAnalysis): CommitGroup[] {
    const { filesChanged } = analysis;
    const groups: Map<string, string[]> = new Map();

    // Priority order for grouping
    const priorities = [
      {
        key: "config",
        pattern: (f: string) =>
          f.includes("package.json") ||
          f.includes("tsconfig") ||
          f.includes(".config"),
      },
      {
        key: "types",
        pattern: (f: string) => f.includes("type") || f.includes("interface"),
      },
      {
        key: "tests",
        pattern: (f: string) =>
          f.includes("test") || f.includes("spec") || f.includes("__tests__"),
      },
      {
        key: "docs",
        pattern: (f: string) => f.includes("README") || f.endsWith(".md"),
      },
      {
        key: "styles",
        pattern: (f: string) =>
          f.includes("style") || f.endsWith(".css") || f.endsWith(".scss"),
      },
      {
        key: "components",
        pattern: (f: string) =>
          f.includes("component") || f.includes("Component"),
      },
      {
        key: "api",
        pattern: (f: string) => f.includes("api") || f.includes("endpoint"),
      },
      {
        key: "utils",
        pattern: (f: string) => f.includes("util") || f.includes("helper"),
      },
    ];

    // Group files by concern
    const ungrouped: string[] = [];

    for (const file of filesChanged) {
      let grouped = false;

      for (const { key, pattern } of priorities) {
        if (pattern(file)) {
          if (!groups.has(key)) {
            groups.set(key, []);
          }
          groups.get(key)!.push(file);
          grouped = true;
          break;
        }
      }

      if (!grouped) {
        ungrouped.push(file);
      }
    }

    // Group remaining files by directory
    if (ungrouped.length > 0) {
      const dirGroups = new Map<string, string[]>();

      for (const file of ungrouped) {
        const dir = file.split("/")[0] || "root";
        if (!dirGroups.has(dir)) {
          dirGroups.set(dir, []);
        }
        dirGroups.get(dir)!.push(file);
      }

      dirGroups.forEach((files, dir) => {
        groups.set(`feature-${dir}`, files);
      });
    }

    // Convert to CommitGroup array
    const commitGroups: CommitGroup[] = [];

    for (const [key, files] of groups.entries()) {
      if (files.length === 0) continue;

      const groupAnalysis = this.createGroupAnalysis(files, analysis);
      const suggestedMessage = this.suggestMessageForGroup(key, files);
      const reason = this.getGroupReason(key, files);

      commitGroups.push({
        files,
        analysis: groupAnalysis,
        suggestedMessage,
        reason,
      });
    }

    // Sort by logical commit order
    return this.sortCommitGroups(commitGroups);
  }

  /**
   * Create analysis for a specific file group
   */
  private createGroupAnalysis(
    files: string[],
    fullAnalysis: GitAnalysis
  ): GitAnalysis {
    // Get diff for specific files
    const filesStr = files.map((f) => `"${f}"`).join(" ");
    const diff = this.exec(`git diff --cached -- ${filesStr}`);

    const additions = (diff.match(/^\+(?!\+)/gm) || []).length;
    const deletions = (diff.match(/^-(?!-)/gm) || []).length;

    return {
      filesChanged: files,
      additions,
      deletions,
      hasStaged: true,
      hasUnstaged: fullAnalysis.hasUnstaged,
      diff,
    };
  }

  /**
   * Suggest commit message for a group
   */
  private suggestMessageForGroup(key: string, files: string[]): CommitMessage {
    const typeMap: Record<string, { type: string; subject: string }> = {
      config: { type: "chore", subject: "update configuration" },
      types: { type: "feat", subject: "update type definitions" },
      tests: { type: "test", subject: "add/update tests" },
      docs: { type: "docs", subject: "update documentation" },
      styles: { type: "style", subject: "update styles" },
      components: { type: "feat", subject: "update components" },
      api: { type: "feat", subject: "update API endpoints" },
      utils: { type: "feat", subject: "update utility functions" },
    };

    const suggestion = typeMap[key] || {
      type: "feat",
      subject: "update files",
    };

    // Infer scope from files
    const scope = this.inferScopeFromFiles(files);

    return {
      type: suggestion.type,
      scope,
      subject: suggestion.subject,
    };
  }

  private inferScopeFromFiles(files: string[]): string | undefined {
    if (files.length === 0) return undefined;

    const dirs = files
      .map((f) => f.split("/")[0])
      .filter((d) => d && !d.startsWith("."));

    if (dirs.length === 0) return undefined;

    const dirCount = dirs.reduce((acc, d) => {
      acc[d] = (acc[d] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostCommon = Object.entries(dirCount).sort((a, b) => b[1] - a[1])[0];

    return mostCommon[1] >= files.length * 0.6 ? mostCommon[0] : undefined;
  }

  /**
   * Get human-readable reason for grouping
   */
  private getGroupReason(key: string, files: string[]): string {
    const reasonMap: Record<string, string> = {
      config: "Configuration changes",
      types: "Type definition updates",
      tests: "Test additions/updates",
      docs: "Documentation updates",
      styles: "Styling changes",
      components: "Component updates",
      api: "API changes",
      utils: "Utility function updates",
    };

    return reasonMap[key] || `${files.length} related files`;
  }

  /**
   * Sort groups in logical commit order
   */
  private sortCommitGroups(groups: CommitGroup[]): CommitGroup[] {
    const order = [
      "types",
      "config",
      "api",
      "components",
      "utils",
      "styles",
      "tests",
      "docs",
    ];

    return groups.sort((a, b) => {
      const aKey = this.getGroupKey(a);
      const bKey = this.getGroupKey(b);

      const aIndex = order.indexOf(aKey);
      const bIndex = order.indexOf(bKey);

      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;

      return aIndex - bIndex;
    });
  }

  private getGroupKey(group: CommitGroup): string {
    return group.reason.toLowerCase().split(" ")[0];
  }
}
