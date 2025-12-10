// ./src/utils/commit-history.ts

import { execSync } from "child_process";
import { CommitMessage } from "../types";

export interface CommitHistoryPattern {
  commonTypes: Record<string, number>;
  commonScopes: Record<string, number>;
  avgSubjectLength: number;
  commonPhrases: string[];
  stylePreferences: {
    usesEmoji: boolean;
    capitalizesSubject: boolean;
    usesPeriod: boolean;
  };
}

export class CommitHistoryAnalyzer {
  private cache: CommitHistoryPattern | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 300000; // 5 minutes

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
   * Get commit history pattern (cached for performance)
   */
  async getCommitPattern(): Promise<CommitHistoryPattern | null> {
    const now = Date.now();

    // Return cached data if still valid
    if (this.cache && now - this.cacheTimestamp < this.CACHE_TTL) {
      return this.cache;
    }

    try {
      // Get last 50 commits (balance between insight and performance)
      const commits = this.exec('git log -50 --pretty=format:"%s"');

      if (!commits) return null;

      const commitLines = commits.split("\n").filter(Boolean);
      if (commitLines.length < 5) return null; // Need minimum data

      const pattern = this.analyzeCommits(commitLines);

      // Cache the result
      this.cache = pattern;
      this.cacheTimestamp = now;

      return pattern;
    } catch {
      return null;
    }
  }

  private analyzeCommits(commits: string[]): CommitHistoryPattern {
    const types: Record<string, number> = {};
    const scopes: Record<string, number> = {};
    const lengths: number[] = [];
    const phrases: Record<string, number> = {};
    let emojiCount = 0;
    let capitalizedCount = 0;
    let periodCount = 0;

    for (const commit of commits) {
      // Parse conventional commit format
      const match = commit.match(/^(\w+)(\(([^)]+)\))?(!)?:\s*(.+)$/);

      if (match) {
        const [, type, , scope, , subject] = match;

        // Track types
        types[type] = (types[type] || 0) + 1;

        // Track scopes
        if (scope) {
          scopes[scope] = (scopes[scope] || 0) + 1;
        }

        // Track subject characteristics
        lengths.push(subject.length);

        // Check for emojis
        if (/[\p{Emoji}]/u.test(commit)) {
          emojiCount++;
        }

        // Check capitalization
        if (subject[0] === subject[0].toUpperCase()) {
          capitalizedCount++;
        }

        // Check for period
        if (subject.endsWith(".")) {
          periodCount++;
        }

        // Extract common phrases (first 3 words)
        const words = subject.toLowerCase().split(" ").slice(0, 3).join(" ");
        if (words.length > 5) {
          phrases[words] = (phrases[words] || 0) + 1;
        }
      }
    }

    // Get top phrases
    const commonPhrases = Object.entries(phrases)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([phrase]) => phrase);

    return {
      commonTypes: types,
      commonScopes: scopes,
      avgSubjectLength:
        lengths.length > 0
          ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length)
          : 50,
      commonPhrases,
      stylePreferences: {
        usesEmoji: emojiCount > commits.length * 0.3,
        capitalizesSubject: capitalizedCount > commits.length * 0.5,
        usesPeriod: periodCount > commits.length * 0.3,
      },
    };
  }

  /**
   * Personalize suggestions based on history
   */
  personalizeCommitMessage(
    message: CommitMessage,
    pattern: CommitHistoryPattern
  ): CommitMessage {
    const personalized = { ...message };

    // Adjust subject length if user typically writes shorter/longer
    if (pattern.avgSubjectLength < 40 && personalized.subject.length > 50) {
      personalized.subject = personalized.subject.slice(0, 47) + "...";
    }

    // Apply capitalization preference
    if (pattern.stylePreferences.capitalizesSubject) {
      personalized.subject =
        personalized.subject[0].toUpperCase() + personalized.subject.slice(1);
    } else {
      personalized.subject =
        personalized.subject[0].toLowerCase() + personalized.subject.slice(1);
    }

    // Apply period preference
    if (
      pattern.stylePreferences.usesPeriod &&
      !personalized.subject.endsWith(".")
    ) {
      personalized.subject += ".";
    } else if (
      !pattern.stylePreferences.usesPeriod &&
      personalized.subject.endsWith(".")
    ) {
      personalized.subject = personalized.subject.slice(0, -1);
    }

    return personalized;
  }

  /**
   * Get preferred type based on history
   */
  getPreferredType(pattern: CommitHistoryPattern, defaultType: string): string {
    const types = Object.entries(pattern.commonTypes).sort(
      (a, b) => b[1] - a[1]
    );

    // If user heavily favors a type (>40% usage), suggest it
    if (
      types.length > 0 &&
      types[0][1] > pattern.commonTypes[defaultType] * 1.5
    ) {
      return types[0][0];
    }

    return defaultType;
  }

  /**
   * Get suggested scope based on history and current files
   */
  getSuggestedScope(
    pattern: CommitHistoryPattern,
    inferredScope: string
  ): string {
    // Check if inferred scope matches a common scope
    const commonScopes = Object.keys(pattern.commonScopes);

    for (const scope of commonScopes) {
      if (inferredScope.includes(scope) || scope.includes(inferredScope)) {
        return scope;
      }
    }

    return inferredScope;
  }
}
