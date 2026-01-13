/**
 * Calculates the number of credits to yield based on the actual amount paid vs expected amount.
 *
 * @param paidAmount The actual amount paid by the user (e.g. 10.00).
 * @param expectedAmount The expected billing amount (e.g. 367.4375).
 * @param expectedCredits The number of credits expected for the full amount (e.g. 20).
 * @returns The calculated credits, generally proportional to the payment.
 */
export function calculateDepositCredits(
  paidAmount: number,
  expectedAmount: number,
  expectedCredits: number
): number {
  if (expectedAmount <= 0) return 0;

  // Calculate ratio
  const ratio = paidAmount / expectedAmount;

  // Return proportional credits
  // We don't round here to allow fractional credits for now, or maybe we should?
  // The user said "367 NGN worth of credits (20 credits)"
  // If they pay 10 NGN: (10 / 367) * 20 = ~0.54 credits.
  // Transaction model credits is Number, so decimals are fine.
  return ratio * expectedCredits;
}
