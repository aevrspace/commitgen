import { Schema, model, models } from "mongoose";

/**
 * WalletTransaction Model
 *
 * Tracks all credit movements (credits and debits) for wallet balance calculation.
 * The balance is computed in real-time as sum(credits) - sum(debits).
 */
const WalletTransactionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: {
    type: String,
    enum: ["credit", "debit", "deposit", "transfer", "withdrawal"],
    required: true,
  },
  // Number of credits affected (positive value, direction determined by type)
  credits: { type: Number, required: true, default: 0 },
  // Monetary amount (for deposits/withdrawals)
  amount: { type: Number, default: 0 },
  fee: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["pending", "processing", "confirmed", "failed"],
    default: "pending",
  },
  // Reference from payment provider (Paystack, 100Pay, etc.)
  providerReference: { type: String, unique: true, sparse: true },
  // Link to CreditUsage for debit transactions
  usageRef: { type: Schema.Types.ObjectId, ref: "CreditUsage" },
  // Flexible metadata for additional context
  metadata: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
});

// Indexes for efficient balance calculation and queries
WalletTransactionSchema.index({ userId: 1, status: 1, type: 1 });
WalletTransactionSchema.index({ userId: 1, createdAt: -1 });
WalletTransactionSchema.index({ providerReference: 1 });

export const WalletTransaction =
  models.WalletTransaction ||
  model("WalletTransaction", WalletTransactionSchema);
