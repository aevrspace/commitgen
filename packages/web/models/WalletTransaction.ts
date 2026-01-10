import { Schema, model, models } from "mongoose";

const WalletTransactionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: {
    type: String,
    enum: ["deposit", "transfer", "withdrawal"],
    required: true,
  },
  amount: { type: Number, required: true },
  fee: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["pending", "processing", "confirmed", "failed"],
    default: "pending",
  },
  providerReference: { type: String, unique: true, required: true },
  metadata: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
});

export const WalletTransaction =
  models.WalletTransaction ||
  model("WalletTransaction", WalletTransactionSchema);
