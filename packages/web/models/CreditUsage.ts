import { Schema, model, models } from "mongoose";

/**
 * CreditUsage Model
 *
 * Tracks what each credit was used for, providing a complete audit trail
 * of how credits are consumed in the system.
 */
const CreditUsageSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: {
    type: String,
    enum: ["commit_generation", "api_call", "other"],
    required: true,
  },
  creditsUsed: { type: Number, required: true, default: 1 },
  metadata: {
    // AI Generation Details
    model: String,
    diffLength: Number,
    promptTokens: Number,
    completionTokens: Number,
    responseLength: Number,

    // Request Context
    requestId: String,
    userAgent: String,
    ipAddress: String,

    // API Key Info (for CLI usage)
    apiKeyUsed: String,

    // Additional context
    description: String,
  },
  transactionRef: { type: Schema.Types.ObjectId, ref: "WalletTransaction" },
  createdAt: { type: Date, default: Date.now },
});

// Index for efficient queries
CreditUsageSchema.index({ userId: 1, createdAt: -1 });
CreditUsageSchema.index({ transactionRef: 1 });

export const CreditUsage =
  models.CreditUsage || model("CreditUsage", CreditUsageSchema);
