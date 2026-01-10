export interface PaystackFeeConfig {
  percentage: number; // e.g. 0.015 for 1.5%
  flatFee: number; // e.g. 100
  flatFeeThreshold: number; // e.g. 2500
  cap: number; // e.g. 2000
}

export const PAYSTACK_CONFIG: PaystackFeeConfig = {
  percentage: 0.015,
  flatFee: 100,
  flatFeeThreshold: 2500,
  cap: 2000,
};

/**
 * Calculates the total amount the user needs to pay so that the merchant receives the `amount`.
 * Paystack Standard Formula:
 * If Total < 2500: Fee = 1.5%
 * If Total >= 2500: Fee = 1.5% + 100
 * Max Fee = 2000
 *
 * We need to reverse this to find Total given Amount (Settlement).
 */
export function calculatePaystackTotal(
  amount: number,
  config: PaystackFeeConfig = PAYSTACK_CONFIG
): number {
  if (amount <= 0) return 0;

  const { percentage, flatFee, flatFeeThreshold, cap } = config;

  // Let T be Total, A be Amount (Settlement).
  // T - Fee = A
  // Fee = min(T * P + (T >= 2500 ? F : 0), Cap)

  // Case 1: Cap is hit.
  // Fee = 2000.
  // T - 2000 = A  => T = A + 2000.
  // Check if T * P + ... would have been > 2000.
  // This usually happens for large amounts.
  const totalWithCap = amount + cap;
  // Calculate what the fee WOULD be for this total
  const feeForCapScenario =
    totalWithCap * percentage +
    (totalWithCap >= flatFeeThreshold ? flatFee : 0);
  if (feeForCapScenario > cap) {
    return Math.ceil(totalWithCap * 100) / 100; // Cap applies
  }

  // Case 2: Standard formula (Below Cap).
  // Helper to solve T = (A + Flat) / (1 - P)
  // But Flat only applies if T >= 2500.

  // Sub-case 2a: Assume T < 2500 (No flat fee)
  // T = A / (1 - P)
  let total = amount / (1 - percentage);
  if (total < flatFeeThreshold) {
    // Confirmed T < 2500.
    // Check if fee exceeds cap? (Unlikely for small amounts)
    return Math.ceil(total * 100) / 100;
  }

  // Sub-case 2b: Assume T >= 2500 (Flat fee applies)
  // T = (A + F) / (1 - P)
  total = (amount + flatFee) / (1 - percentage);
  if (total >= flatFeeThreshold) {
    return Math.ceil(total * 100) / 100;
  }

  // Edge case: "Hole" in function?
  // If P puts it right at the boundary... usually 2b covers it.
  return Math.ceil(total * 100) / 100;
}

export function calculateFee(
  total: number,
  config: PaystackFeeConfig = PAYSTACK_CONFIG
): number {
  const { percentage, flatFee, flatFeeThreshold, cap } = config;
  let fee = total * percentage;
  if (total >= flatFeeThreshold) {
    fee += flatFee;
  }
  if (fee > cap) {
    fee = cap;
  }
  return fee;
}
