// ./src/utils/issue-tracker.ts

import { execSync } from "child_process";
import { CommitMessage } from "../types";

export interface IssueReference {
  platform: "jira" | "github" | "linear" | "gitlab" | "unknown";
  issueKey: string;
  issueType?: string;
  branchName: string;
}

export class IssueTrackerIntegration {
  private cache: IssueReference | null = null;

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
   * Extract issue reference from current branch
   */
  extractIssueFromBranch(): IssueReference | null {
    // Check cache first
    if (this.cache) return this.cache;

    const branchName = this.exec("git branch --show-current");
    if (!branchName) return null;

    const issue = this.parseIssueFromBranch(branchName);

    // Cache the result
    this.cache = issue;

    return issue;
  }

  /**
   * Parse issue reference from branch name
   */
  private parseIssueFromBranch(branchName: string): IssueReference | null {
    // Jira pattern: PROJ-123 or feature/PROJ-123-description
    const jiraMatch = branchName.match(/([A-Z]{2,10}-\d+)/);
    if (jiraMatch) {
      return {
        platform: "jira",
        issueKey: jiraMatch[1],
        branchName,
        issueType: this.inferIssueType(branchName),
      };
    }

    // GitHub issue pattern: #123 or issue-123 or 123-description
    const githubMatch = branchName.match(/(?:issue[/-]|#)?(\d+)(?:[/-]|$)/i);
    if (githubMatch) {
      return {
        platform: "github",
        issueKey: `#${githubMatch[1]}`,
        branchName,
        issueType: this.inferIssueType(branchName),
      };
    }

    // Linear pattern: TEAM-123 or team/TEAM-123-description
    const linearMatch = branchName.match(/([A-Z]{2,5}-\d+)/);
    if (linearMatch) {
      return {
        platform: "linear",
        issueKey: linearMatch[1],
        branchName,
        issueType: this.inferIssueType(branchName),
      };
    }

    // GitLab issue pattern: similar to GitHub
    const gitlabMatch = branchName.match(/(?:issue[/-]|#)?(\d+)(?:[/-]|$)/i);
    if (gitlabMatch && this.isGitLabRepo()) {
      return {
        platform: "gitlab",
        issueKey: `#${gitlabMatch[1]}`,
        branchName,
        issueType: this.inferIssueType(branchName),
      };
    }

    return null;
  }

  /**
   * Infer issue type from branch name
   */
  private inferIssueType(branchName: string): string | undefined {
    const lower = branchName.toLowerCase();

    if (lower.startsWith("feature/") || lower.includes("/feature/")) {
      return "feature";
    }
    if (
      lower.startsWith("fix/") ||
      lower.startsWith("bugfix/") ||
      lower.includes("/fix/")
    ) {
      return "fix";
    }
    if (lower.startsWith("hotfix/") || lower.includes("/hotfix/")) {
      return "hotfix";
    }
    if (lower.startsWith("refactor/") || lower.includes("/refactor/")) {
      return "refactor";
    }
    if (lower.startsWith("docs/") || lower.includes("/docs/")) {
      return "docs";
    }
    if (lower.startsWith("test/") || lower.includes("/test/")) {
      return "test";
    }
    if (lower.startsWith("chore/") || lower.includes("/chore/")) {
      return "chore";
    }

    return undefined;
  }

  /**
   * Check if repository is GitLab
   */
  private isGitLabRepo(): boolean {
    const remote = this.exec("git config --get remote.origin.url");
    return remote.includes("gitlab");
  }

  /**
   * Append issue reference to commit message
   */
  appendIssueToCommit(
    message: CommitMessage,
    issue: IssueReference
  ): CommitMessage {
    const enhanced = { ...message };

    // Add issue reference based on platform conventions
    switch (issue.platform) {
      case "jira":
        // Jira: Add to subject if not already there
        if (!enhanced.subject.includes(issue.issueKey)) {
          enhanced.subject = `${enhanced.subject} [${issue.issueKey}]`;
        }
        // Also add to footer
        if (enhanced.body) {
          enhanced.body += `\n\nJira: ${issue.issueKey}`;
        } else {
          enhanced.body = `Jira: ${issue.issueKey}`;
        }
        break;

      case "github":
        // GitHub: Add to footer for auto-linking
        if (enhanced.body) {
          enhanced.body += `\n\nCloses ${issue.issueKey}`;
        } else {
          enhanced.body = `Closes ${issue.issueKey}`;
        }
        break;

      case "linear":
        // Linear: Add to subject
        if (!enhanced.subject.includes(issue.issueKey)) {
          enhanced.subject = `${enhanced.subject} [${issue.issueKey}]`;
        }
        break;

      case "gitlab":
        // GitLab: Add to footer for auto-linking
        if (enhanced.body) {
          enhanced.body += `\n\nCloses ${issue.issueKey}`;
        } else {
          enhanced.body = `Closes ${issue.issueKey}`;
        }
        break;
    }

    return enhanced;
  }

  /**
   * Suggest commit type based on issue type
   */
  suggestTypeFromIssue(issue: IssueReference, defaultType: string): string {
    if (!issue.issueType) return defaultType;

    const typeMap: Record<string, string> = {
      feature: "feat",
      fix: "fix",
      bugfix: "fix",
      hotfix: "fix",
      refactor: "refactor",
      docs: "docs",
      test: "test",
      chore: "chore",
    };

    return typeMap[issue.issueType] || defaultType;
  }

  /**
   * Get display string for issue
   */
  getIssueDisplay(issue: IssueReference): string {
    const platformEmoji: Record<string, string> = {
      jira: "🎫",
      github: "🐙",
      linear: "📐",
      gitlab: "🦊",
      unknown: "🔗",
    };

    const emoji = platformEmoji[issue.platform] || "🔗";
    const platform =
      issue.platform.charAt(0).toUpperCase() + issue.platform.slice(1);

    return `${emoji} ${platform}: ${issue.issueKey}`;
  }

  /**
   * Clear cache (useful for testing or branch switches)
   */
  clearCache(): void {
    this.cache = null;
  }
}
