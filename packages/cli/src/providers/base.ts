// ./src/providers/base.ts

import { CommitMessage, GitAnalysis } from "../types";

export abstract class BaseProvider {
  protected analysis: GitAnalysis | null = null;

  abstract generateCommitMessage(
    analysis: GitAnalysis,
  ): Promise<CommitMessage[]>;

  protected inferFeatureType(files: string[]): string {
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

  protected inferScope(files: string[]): string {
    if (files.length === 0) return "project";

    const dirs = files
      .map((f) => f.split("/")[0])
      .filter((d) => d && !d.startsWith("."));

    if (dirs.length === 0) return "root";

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

    if (dirCount[mostCommon] >= files.length * 0.6) {
      return mostCommon;
    }

    return "multiple modules";
  }

  protected buildSystemPrompt(): string {
    return `You are an expert at writing conventional commit messages.
Your task is to analyze git changes and generate clear, concise commit messages following the Conventional Commits specification.

Commit types:
- feat: A new feature
- fix: A bug fix
- docs: Documentation changes
- style: Code style changes (formatting, missing semi-colons, etc)
- refactor: Code changes that neither fix a bug nor add a feature
- perf: Performance improvements
- test: Adding or updating tests
- build: Changes to build system or dependencies
- ci: Changes to CI configuration
- chore: Other changes that don't modify src or test files
- revert: Reverts a previous commit

Format: type(scope): subject

Rules:
- Use imperative mood ("add" not "added" or "adds")
- Don't capitalize first letter of subject
- No period at the end of subject
- Keep subject under 50 characters
- Be specific but concise
- Include scope when relevant
- Add breaking change marker (!) when applicable`;
  }

  protected buildAnalysisPrompt(analysis: GitAnalysis): string {
    const { filesChanged, additions, deletions, diff } = analysis;

    return `Analyze these git changes and generate 3-5 commit message suggestions:

Files changed (${filesChanged.length}):
${filesChanged
  .slice(0, 20)
  .map((f) => `- ${f}`)
  .join("\n")}
${filesChanged.length > 20 ? `... and ${filesChanged.length - 20} more files` : ""}

Statistics:
- Additions: +${additions}
- Deletions: -${deletions}

Git diff (first 2000 characters):
\`\`\`
${diff.slice(0, 2000)}
\`\`\`

Return your response as a JSON array of commit messages:
[
  {
    "type": "feat",
    "scope": "auth",
    "subject": "add OAuth2 authentication",
    "body": "Optional detailed description",
    "breaking": false
  }
]

Generate 3-5 suggestions, ordered from most to least relevant.`;
  }
}
