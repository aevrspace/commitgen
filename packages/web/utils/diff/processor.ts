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
// We need to stay safely under 6000 TPM limit (including system prompt + response)
// System prompt ~1000 tokens, Output ~500 tokens. Safe buffer ~4500 tokens.
// 4500 tokens * 4 chars/token = ~18000 chars. Let's be conservative with 16000.
const MAX_DIFF_LENGTH = 16000;
const MAX_FILE_CONTENT_LENGTH = 2000; // Reduced to fit more files
const MAX_FILES_TO_PROCESS = 20; // Only process detailed diffs for top 20 files

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
 * 2. If too large, use "Top N Files" strategy:
 *    - Sort by importance (Source > Config > Lock)
 *    - Process top N files detailed
 *    - List remaining files as summary only
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

  // Parse all files
  const files = parseDiffFiles(diff);
  const changes = countChanges(diff);

  // Priority: source files > config files > lock files/generated
  const priorityOrder = (filename: string): number => {
    const lower = filename.toLowerCase();
    if (lower.includes("lock") || lower.endsWith(".lock")) return 4;
    if (lower.includes("min.js") || lower.includes("map")) return 4;
    if (
      lower.endsWith(".json") ||
      lower.endsWith(".yaml") ||
      lower.endsWith(".yml") ||
      lower.endsWith(".toml") ||
      lower.endsWith(".xml")
    )
      return 3;
    if (lower.endsWith(".md") || lower.endsWith(".txt")) return 2;
    return 1; // Code files are highest priority
  };

  // Sort files by priority
  const sortedFiles = [...files].sort(
    (a, b) => priorityOrder(a.filename) - priorityOrder(b.filename)
  );

  // Take top N files for detailed processing
  const topFiles = sortedFiles.slice(0, MAX_FILES_TO_PROCESS);
  const remainingFiles = sortedFiles.slice(MAX_FILES_TO_PROCESS);

  // Calculate strict space per file
  // Reserve ~500 chars for header and footer
  const availableSpace = MAX_DIFF_LENGTH - 500;
  const targetLengthPerFile = Math.floor(
    availableSpace / Math.max(topFiles.length, 1)
  );
  const perFileLimit = Math.min(targetLengthPerFile, MAX_FILE_CONTENT_LENGTH);

  // Build summarized diff
  let processedDiff = "";

  // Add summary header
  processedDiff += `# Git Diff Summary\n`;
  processedDiff += `# Files changed: ${files.length}\n`;
  processedDiff += `# Additions: +${changes.additions}, Deletions: -${changes.deletions}\n\n`;
  processedDiff += `# Showing detailed diffs for top ${topFiles.length} files. Others are listed below.\n\n`;

  // Process top files
  for (const file of topFiles) {
    const summarized = `diff --git a/${file.filename} b/${
      file.filename
    }\n${summarizeFileDiff(file.content, perFileLimit)}\n`;

    // Double check total length (should be safe due to conservative math, but good to check)
    if (processedDiff.length + summarized.length > MAX_DIFF_LENGTH) {
      // Stop early if we somehow hit the limit
      break;
    }
    processedDiff += summarized;
  }

  // Append summary of remaining files if any
  if (remainingFiles.length > 0) {
    processedDiff += `\n# ... and ${remainingFiles.length} more files changed:\n`;
    // List remaining files, but don't blow the limit
    let currentLength = processedDiff.length;
    for (const file of remainingFiles) {
      const line = `# ${file.filename}\n`;
      if (currentLength + line.length > MAX_DIFF_LENGTH + 1000) {
        // Allow a bit of overflow for file list
        processedDiff += `# ... (list truncated)`;
        break;
      }
      processedDiff += line;
      currentLength += line.length;
    }
  }

  return {
    content: processedDiff,
    stats: {
      totalFiles: files.length,
      additions: changes.additions,
      deletions: changes.deletions,
      filesChanged: files.map((f) => f.filename), // Return all original filenames
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
