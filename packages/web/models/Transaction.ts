import { Schema, model, models, Document, Types } from "mongoose";

/**
 * Transaction Model
 *
 * Tracks all monetary and credit movements.
 * Balance is computed from the sum of credits and debits per wallet.
 */

export interface ITransaction extends Document {
  type: "credit" | "debit";
  status: "pending" | "successful" | "failed" | "reversed";
  symbol: string;
  user: Types.ObjectId;
  wallet: Types.ObjectId;
  category: "deposit" | "usage" | "transfer" | "withdrawal" | "bonus";
  channel?: string;
  amount: number;
  fee: number;
  providerReference?: string;
  usageRef?: Types.ObjectId;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const SUPPORTED_SYMBOLS = [
  // Fiat
  "NGN",
  "USD",
  "EUR",
  "GBP",
  // Crypto
  "BTC",
  "ETH",
  "USDC",
  "USDT",
  "PAY",
  // Internal
  "CREDITS",
] as const;

const TRANSACTION_TYPES = ["credit", "debit"] as const;
const TRANSACTION_STATUSES = [
  "pending",
  "successful",
  "failed",
  "reversed",
] as const;
const TRANSACTION_CATEGORIES = [
  "deposit",
  "usage",
  "transfer",
  "withdrawal",
  "bonus",
] as const;
const TRANSACTION_CHANNELS = [
  "100pay",
  "paystack",
  "internal",
  "system",
] as const;

const TransactionSchema = new Schema<ITransaction>(
  {
    type: {
      type: String,
      enum: TRANSACTION_TYPES,
      required: true,
    },
    status: {
      type: String,
      enum: TRANSACTION_STATUSES,
      default: "pending",
    },
    symbol: {
      type: String,
      enum: SUPPORTED_SYMBOLS,
      required: true,
    },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    wallet: { type: Schema.Types.ObjectId, ref: "Wallet", required: true },
    category: {
      type: String,
      enum: TRANSACTION_CATEGORIES,
      required: true,
    },
    channel: {
      type: String,
      enum: TRANSACTION_CHANNELS,
    },
    // Amount in the wallet's symbol (e.g., credits for CREDITS wallet)
    amount: { type: Number, required: true, default: 0 },
    fee: { type: Number, default: 0 },
    // Reference from payment provider (Paystack, 100Pay, etc.)
    providerReference: { type: String, unique: true, sparse: true },
    // Link to CreditUsage for debit/usage transactions
    usageRef: { type: Schema.Types.ObjectId, ref: "CreditUsage" },
    // Flexible metadata for additional context
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Indexes for efficient balance calculation and queries
TransactionSchema.index({ wallet: 1, status: 1, type: 1 });
TransactionSchema.index({ user: 1, status: 1, type: 1 });
TransactionSchema.index({ user: 1, createdAt: -1 });
TransactionSchema.index({ providerReference: 1 });

export const Transaction =
  models.Transaction || model<ITransaction>("Transaction", TransactionSchema);

export {
  SUPPORTED_SYMBOLS,
  TRANSACTION_TYPES,
  TRANSACTION_STATUSES,
  TRANSACTION_CATEGORIES,
  TRANSACTION_CHANNELS,
};
