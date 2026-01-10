import { WalletTransaction } from "@/models/WalletTransaction";
import { CreditUsage } from "@/models/CreditUsage";
import { nanoid } from "nanoid";
import { logger } from "@untools/logger";

interface UsageMetadata {
  model?: string;
  diffLength?: number;
  promptTokens?: number;
  completionTokens?: number;
  responseLength?: number;
  requestId?: string;
  userAgent?: string;
  ipAddress?: string;
  apiKeyUsed?: string;
  description?: string;
}

interface DebitOptions {
  type: "commit_generation" | "api_call" | "other";
  creditsUsed?: number;
  metadata?: UsageMetadata;
}

interface CreditOptions {
  credits: number;
  providerReference: string;
  amount?: number;
  fee?: number;
  metadata?: Record<string, unknown>;
}

/**
 * WalletService
 *
 * Manages credit wallet operations with real-time balance calculation.
 * All credits are tracked through WalletTransaction entries, and usage
 * is linked to CreditUsage for audit purposes.
 */
class WalletService {
  /**
   * Get the current credit balance for a user.
   * Calculated in real-time from confirmed transactions.
   */
  async getBalance(userId: string): Promise<number> {
    try {
      const result = await WalletTransaction.aggregate([
        {
          $match: {
            userId: { $eq: userId },
            status: "confirmed",
          },
        },
        {
          $group: {
            _id: null,
            totalCredits: {
              $sum: {
                $cond: [
                  { $in: ["$type", ["credit", "deposit"]] },
                  "$credits",
                  { $multiply: ["$credits", -1] }, // Debit is negative
                ],
              },
            },
          },
        },
      ]);

      return result.length > 0 ? result[0].totalCredits : 0;
    } catch (error) {
      logger?.error("[WalletService] Failed to get balance:", error);
      throw error;
    }
  }

  /**
   * Check if user has sufficient balance for an operation.
   */
  async hasBalance(userId: string, requiredCredits: number): Promise<boolean> {
    const balance = await this.getBalance(userId);
    return balance >= requiredCredits;
  }

  /**
   * Create a debit transaction for credit usage.
   * Also creates a CreditUsage entry for audit purposes.
   */
  async debit(
    userId: string,
    options: DebitOptions
  ): Promise<{
    transaction: typeof WalletTransaction.prototype;
    usage: typeof CreditUsage.prototype;
  }> {
    const { type, creditsUsed = 1, metadata = {} } = options;

    // 1. Create CreditUsage entry
    const usage = await CreditUsage.create({
      userId,
      type,
      creditsUsed,
      metadata: {
        ...metadata,
        requestId: metadata.requestId || nanoid(),
      },
    });

    // 2. Create debit transaction
    const transaction = await WalletTransaction.create({
      userId,
      type: "debit",
      credits: creditsUsed,
      amount: 0,
      fee: 0,
      status: "confirmed", // Debits are confirmed immediately
      providerReference: `usage-${usage._id.toString()}`,
      usageRef: usage._id,
      metadata: {
        usageType: type,
        ...metadata,
      },
    });

    // 3. Link transaction back to usage
    usage.transactionRef = transaction._id;
    await usage.save();

    logger?.info(
      `[WalletService] Debited ${creditsUsed} credit(s) from user ${userId} for ${type}`
    );

    return { transaction, usage };
  }

  /**
   * Create a credit transaction (for deposits/top-ups).
   * Used by webhooks after successful payment.
   */
  async credit(
    userId: string,
    options: CreditOptions
  ): Promise<typeof WalletTransaction.prototype> {
    const {
      credits,
      providerReference,
      amount = 0,
      fee = 0,
      metadata = {},
    } = options;

    const transaction = await WalletTransaction.create({
      userId,
      type: "credit",
      credits,
      amount,
      fee,
      status: "confirmed",
      providerReference,
      metadata,
    });

    logger?.info(
      `[WalletService] Credited ${credits} credit(s) to user ${userId}`
    );

    return transaction;
  }

  /**
   * Create a pending credit transaction (before payment confirmation).
   */
  async createPendingCredit(
    userId: string,
    options: CreditOptions
  ): Promise<typeof WalletTransaction.prototype> {
    const {
      credits,
      providerReference,
      amount = 0,
      fee = 0,
      metadata = {},
    } = options;

    const transaction = await WalletTransaction.create({
      userId,
      type: "credit",
      credits,
      amount,
      fee,
      status: "pending",
      providerReference,
      metadata,
    });

    logger?.info(
      `[WalletService] Created pending credit of ${credits} credit(s) for user ${userId}`
    );

    return transaction;
  }

  /**
   * Confirm a pending transaction.
   */
  async confirmTransaction(
    providerReference: string,
    additionalMetadata?: Record<string, unknown>
  ): Promise<typeof WalletTransaction.prototype | null> {
    const transaction = await WalletTransaction.findOne({ providerReference });

    if (!transaction) {
      logger?.warn(
        `[WalletService] Transaction not found: ${providerReference}`
      );
      return null;
    }

    if (transaction.status === "confirmed") {
      logger?.info(
        `[WalletService] Transaction already confirmed: ${providerReference}`
      );
      return transaction;
    }

    transaction.status = "confirmed";
    if (additionalMetadata) {
      transaction.metadata = { ...transaction.metadata, ...additionalMetadata };
    }
    await transaction.save();

    logger?.info(`[WalletService] Confirmed transaction: ${providerReference}`);

    return transaction;
  }

  /**
   * Get transaction history for a user.
   */
  async getHistory(
    userId: string,
    options: { page?: number; limit?: number; type?: string } = {}
  ): Promise<{
    transactions: (typeof WalletTransaction.prototype)[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 20, type } = options;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { userId };
    if (type) {
      query.type = type;
    }

    const [transactions, total] = await Promise.all([
      WalletTransaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("usageRef"),
      WalletTransaction.countDocuments(query),
    ]);

    return { transactions, total, page, limit };
  }
}

/**
 * Factory function to create a WalletService instance.
 */
export const createWalletService = (): WalletService => {
  return new WalletService();
};

export type { WalletService, DebitOptions, CreditOptions, UsageMetadata };
