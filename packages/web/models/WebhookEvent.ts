import { Schema, model, models } from "mongoose";

const WebhookEventSchema = new Schema({
  provider: { type: String, required: true, enum: ["paystack", "100pay"] },
  eventType: { type: String, required: true },
  payload: { type: Schema.Types.Mixed, required: true },
  processingStatus: {
    type: String,
    enum: ["received", "processed", "failed"],
    default: "received",
  },
  processingHistory: [
    {
      status: String,
      message: String,
      timestamp: { type: Date, default: Date.now },
    },
  ],
  relatedTransactionId: {
    type: Schema.Types.ObjectId,
    ref: "WalletTransaction",
  },
  createdAt: { type: Date, default: Date.now },
});

export const WebhookEvent =
  models.WebhookEvent || model("WebhookEvent", WebhookEventSchema);
