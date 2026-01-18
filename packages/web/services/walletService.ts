import { Transaction } from "@/models/Transaction";
import { Wallet } from "@/models/Wallet";
import { CreditUsage } from "@/models/CreditUsage";
import { nanoid } from "nanoid";
import { logger } from "@untools/logger";
import mongoose from "mongoose";

interface UsageMetadata {
  model?: string;
  hint?: string;
  diffLength?: number;
  processedDiffLength?: number;
  estimatedTokens?: number;
  tier?: string;
  promptTokens?: number;
  completionTokens?: number;
  responseLength?: number;
  requestId?: string;
  userAgent?: string;
  ipAddress?: string;
  apiKeyUsed?: string;
  description?: string;
  wasTruncated?: boolean;
  filesChanged?: number;
}

interface DebitOptions {
  type: "commit_generation" | "api_call" | "other";
  creditsUsed?: number;
  metadata?: UsageMetadata;
}

interface CreditOptions {
  credits: number;
  providerReference: string;
  channel: "100pay" | "paystack" | "internal" | "system";
  category?: "deposit" | "bonus";
  amount?: number;
  fee?: number;
  metadata?: Record<string, unknown>;
}

/**
 * WalletService
 *
 * Manages credit wallet operations with real-time balance calculation.
 * All credits are tracked through Transaction entries, and usage
 * is linked to CreditUsage for audit purposes.
 */
class WalletService {
  /**
   * Get or create a CREDITS wallet for a user.
   */
  async getCreditsWallet(userId: string) {
    return await Wallet.getOrCreate(userId, "CREDITS");
  }

  /**
   * Get the current credit balance for a user.
   * Calculated in real-time from successful transactions.
   */
  async getBalance(userId: string): Promise<number> {
    try {
      const wallet = await this.getCreditsWallet(userId);
      return await Wallet.getBalance(wallet._id);
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
    options: DebitOptions,
  ): Promise<{
    transaction: typeof Transaction.prototype;
    usage: typeof CreditUsage.prototype;
  }> {
    const { type, creditsUsed = 1, metadata = {} } = options;

    // Get or create wallet
    const wallet = await this.getCreditsWallet(userId);

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
    const transaction = await Transaction.create({
      user: userId,
      wallet: wallet._id,
      type: "debit",
      status: "successful", // Debits are confirmed immediately
      symbol: "CREDITS",
      category: "usage",
      channel: "internal",
      amount: creditsUsed,
      fee: 0,
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
      `[WalletService] Debited ${creditsUsed} credit(s) from user ${userId} for ${type}`,
    );

    return { transaction, usage };
  }

  /**
   * Create a credit transaction (for deposits/top-ups).
   * Used by webhooks after successful payment.
   */
  async credit(
    userId: string,
    options: CreditOptions,
  ): Promise<typeof Transaction.prototype> {
    const {
      credits,
      providerReference,
      channel,
      category = "deposit",
      amount = 0,
      fee = 0,
      metadata = {},
    } = options;

    // Get or create wallet
    const wallet = await this.getCreditsWallet(userId);

    const transaction = await Transaction.create({
      user: userId,
      wallet: wallet._id,
      type: "credit",
      status: "successful",
      symbol: "CREDITS",
      category,
      channel,
      amount: credits,
      fee,
      providerReference,
      metadata,
    });

    logger?.info(
      `[WalletService] Credited ${credits} credit(s) to user ${userId}`,
    );

    return transaction;
  }

  /**
   * Create a pending credit transaction (before payment confirmation).
   */
  async createPendingCredit(
    userId: string,
    options: CreditOptions,
  ): Promise<typeof Transaction.prototype> {
    const {
      credits,
      providerReference,
      channel,
      category = "deposit",
      amount = 0,
      fee = 0,
      metadata = {},
    } = options;

    // Get or create wallet
    const wallet = await this.getCreditsWallet(userId);

    const transaction = await Transaction.create({
      user: userId,
      wallet: wallet._id,
      type: "credit",
      status: "pending",
      symbol: "CREDITS",
      category,
      channel,
      amount: credits,
      fee,
      providerReference,
      metadata,
    });

    logger?.info(
      `[WalletService] Created pending credit of ${credits} credit(s) for user ${userId}`,
    );

    return transaction;
  }

  /**
   * Confirm a pending transaction.
   */
  async confirmTransaction(
    providerReference: string,
    additionalMetadata?: Record<string, unknown>,
  ): Promise<typeof Transaction.prototype | null> {
    const transaction = await Transaction.findOne({ providerReference });

    if (!transaction) {
      logger?.warn(
        `[WalletService] Transaction not found: ${providerReference}`,
      );
      return null;
    }

    if (transaction.status === "successful") {
      logger?.info(
        `[WalletService] Transaction already confirmed: ${providerReference}`,
      );
      return transaction;
    }

    transaction.status = "successful";
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
    options: {
      page?: number;
      limit?: number;
      type?: string;
      symbol?: string;
    } = {},
  ): Promise<{
    transactions: (typeof Transaction.prototype)[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 20, type, symbol } = options;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {
      user: new mongoose.Types.ObjectId(userId),
    };
    if (type) {
      query.type = type;
    }
    if (symbol) {
      query.symbol = symbol;
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("usageRef"),
      Transaction.countDocuments(query),
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
