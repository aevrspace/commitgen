/**
 * Credit Calculator
 *
 * Calculates the number of credits to charge based on input token count.
 * Uses a tiered pricing model to be fair for both small and large inputs.
 */

/**
 * Estimates token count from text.
 * Uses a simple heuristic: ~4 characters per token for English text.
 * This is an approximation - actual tokenization varies by model.
 */
export function estimateTokens(text: string): number {
  // GPT-style tokenization: roughly 4 chars per token for English
  // Whitespace and special chars often count as separate tokens
  const charCount = text.length;
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  // Blend character-based and word-based estimates
  const charBasedTokens = Math.ceil(charCount / 4);
  const wordBasedTokens = Math.ceil(wordCount * 1.3); // Words + subword tokens

  // Use the higher estimate to be conservative
  return Math.max(charBasedTokens, wordBasedTokens, 1);
}

/**
 * Credit tiers based on token usage
 *
 * The pricing model:
 * - Tier 1 (≤1000 tokens): 1 credit - Small diffs, single file changes
 * - Tier 2 (≤3000 tokens): 2 credits - Medium diffs, a few files
 * - Tier 3 (≤6000 tokens): 3 credits - Large diffs, multiple files
 * - Tier 4 (>6000 tokens): 4 credits - Very large diffs (after truncation)
 */
export interface CreditTier {
  name: string;
  maxTokens: number;
  credits: number;
  description: string;
}

export const CREDIT_TIERS: CreditTier[] = [
  {
    name: "small",
    maxTokens: 1000,
    credits: 1,
    description: "Small changes (1-2 files)",
  },
  {
    name: "medium",
    maxTokens: 3000,
    credits: 2,
    description: "Medium changes (3-5 files)",
  },
  {
    name: "large",
    maxTokens: 6000,
    credits: 3,
    description: "Large changes (6+ files)",
  },
  {
    name: "extra-large",
    maxTokens: Infinity,
    credits: 4,
    description: "Very large changes",
  },
];

/**
 * Calculate credits required for a given token count
 */
export function calculateCredits(tokenCount: number): {
  credits: number;
  tier: CreditTier;
} {
  for (const tier of CREDIT_TIERS) {
    if (tokenCount <= tier.maxTokens) {
      return { credits: tier.credits, tier };
    }
  }

  // Fallback to highest tier
  const lastTier = CREDIT_TIERS[CREDIT_TIERS.length - 1];
  return { credits: lastTier.credits, tier: lastTier };
}

/**
 * Calculate credits for a diff string
 */
export function calculateCreditsForDiff(diff: string): {
  credits: number;
  tokens: number;
  tier: CreditTier;
} {
  const tokens = estimateTokens(diff);
  const { credits, tier } = calculateCredits(tokens);
  return { credits, tokens, tier };
}

/**
 * Get a human-readable summary of credit cost
 */
export function getCreditSummary(diff: string): string {
  const { credits, tokens, tier } = calculateCreditsForDiff(diff);
  return `${credits} credit${credits > 1 ? "s" : ""} (${
    tier.name
  }: ~${tokens} tokens)`;
}
