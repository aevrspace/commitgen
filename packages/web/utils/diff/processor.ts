/**
 * Smart Diff Processor
 *
 * Handles large git diffs by extracting the most relevant information
 * while staying within token/character limits for AI models.
 */

interface DiffStats {
  totalFiles: number;
  additions: number;
  deletions: number;
  filesChanged: string[];
  isTruncated: boolean;
  originalLength: number;
  processedLength: number;
}

interface ProcessedDiff {
  content: string;
  stats: DiffStats;
}

// Most AI models can handle ~8000-16000 tokens
// Being conservative: ~4 chars per token, aim for ~6000 tokens = 24000 chars
const MAX_DIFF_LENGTH = 24000;
const MAX_FILE_CONTENT_LENGTH = 3000; // Max content per file

/**
 * Parse a git diff to extract file information
 */
function parseDiffFiles(diff: string): { filename: string; content: string }[] {
  const files: { filename: string; content: string }[] = [];
  const diffPattern =
    /diff --git a\/(.+?) b\/(.+?)\n([\s\S]*?)(?=diff --git|$)/g;

  let match;
  while ((match = diffPattern.exec(diff)) !== null) {
    const filename = match[2]; // Use the 'b/' path (destination)
    const content = match[3];
    files.push({ filename, content });
  }

  return files;
}

/**
 * Summarize a file diff to its most important parts
 */
function summarizeFileDiff(content: string, maxLength: number): string {
  if (content.length <= maxLength) {
    return content;
  }

  // Extract the hunks (@@...@@) and their content
  const hunks: string[] = [];
  const hunkPattern = /@@[\s\S]*?(?=@@|$)/g;
  let match;

  while ((match = hunkPattern.exec(content)) !== null) {
    hunks.push(match[0]);
  }

  // If we have hunks, prioritize showing the first few complete hunks
  if (hunks.length > 0) {
    let result = "";
    for (const hunk of hunks) {
      if (result.length + hunk.length > maxLength) {
        break;
      }
      result += hunk;
    }
    if (result.length < content.length) {
      result += "\n... (truncated)";
    }
    return result;
  }

  // Fallback: simple truncation
  return content.substring(0, maxLength) + "\n... (truncated)";
}

/**
 * Count additions and deletions in a diff
 */
function countChanges(diff: string): { additions: number; deletions: number } {
  const lines = diff.split("\n");
  let additions = 0;
  let deletions = 0;

  for (const line of lines) {
    if (line.startsWith("+") && !line.startsWith("+++")) {
      additions++;
    } else if (line.startsWith("-") && !line.startsWith("---")) {
      deletions++;
    }
  }

  return { additions, deletions };
}

/**
 * Process a git diff for AI consumption
 *
 * Strategies:
 * 1. If diff is small enough, use as-is
 * 2. If too large, summarize each file and combine
 * 3. If still too large, prioritize files by importance (non-config, non-lock files first)
 */
export function processDiff(diff: string): ProcessedDiff {
  const originalLength = diff.length;

  // If small enough, return as-is
  if (diff.length <= MAX_DIFF_LENGTH) {
    const changes = countChanges(diff);
    const files = parseDiffFiles(diff);
    return {
      content: diff,
      stats: {
        totalFiles: files.length,
        additions: changes.additions,
        deletions: changes.deletions,
        filesChanged: files.map((f) => f.filename),
        isTruncated: false,
        originalLength,
        processedLength: diff.length,
      },
    };
  }

  // Parse files and prioritize
  const files = parseDiffFiles(diff);

  // Priority: source files > config files > lock files
  const priorityOrder = (filename: string): number => {
    if (filename.includes("lock") || filename.endsWith(".lock")) return 3;
    if (
      filename.endsWith(".json") ||
      filename.endsWith(".yaml") ||
      filename.endsWith(".yml") ||
      filename.endsWith(".toml")
    )
      return 2;
    return 1;
  };

  const sortedFiles = [...files].sort(
    (a, b) => priorityOrder(a.filename) - priorityOrder(b.filename)
  );

  // Calculate how much space per file
  const targetLengthPerFile = Math.floor(
    MAX_DIFF_LENGTH / Math.max(files.length, 1)
  );
  const perFileLimit = Math.min(targetLengthPerFile, MAX_FILE_CONTENT_LENGTH);

  // Build summarized diff
  let processedDiff = "";
  const includedFiles: string[] = [];
  const changes = countChanges(diff);

  // Add summary header
  processedDiff += `# Git Diff Summary\n`;
  processedDiff += `# Files changed: ${files.length}\n`;
  processedDiff += `# Additions: +${changes.additions}, Deletions: -${changes.deletions}\n\n`;

  for (const file of sortedFiles) {
    const summarized = `diff --git a/${file.filename} b/${
      file.filename
    }\n${summarizeFileDiff(file.content, perFileLimit)}\n`;

    if (processedDiff.length + summarized.length > MAX_DIFF_LENGTH) {
      // Add note about excluded files
      const excludedFiles = sortedFiles
        .slice(includedFiles.length)
        .map((f) => f.filename);
      processedDiff += `\n# ${
        excludedFiles.length
      } more file(s) not shown: ${excludedFiles.slice(0, 5).join(", ")}${
        excludedFiles.length > 5 ? "..." : ""
      }`;
      break;
    }

    processedDiff += summarized;
    includedFiles.push(file.filename);
  }

  return {
    content: processedDiff,
    stats: {
      totalFiles: files.length,
      additions: changes.additions,
      deletions: changes.deletions,
      filesChanged: files.map((f) => f.filename),
      isTruncated: true,
      originalLength,
      processedLength: processedDiff.length,
    },
  };
}

/**
 * Quick check if a diff needs processing
 */
export function needsProcessing(diff: string): boolean {
  return diff.length > MAX_DIFF_LENGTH;
}

export type { ProcessedDiff, DiffStats };
