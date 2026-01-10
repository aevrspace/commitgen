import { NextResponse } from "next/server";
import crypto from "crypto";
import { WalletTransaction } from "@/models/WalletTransaction";
import User from "@/models/User";
import { WebhookEvent } from "@/models/WebhookEvent";

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY!;
  const signature = request.headers.get("x-paystack-signature");
  const body = await request.text();

  // 1. Verify Signature
  const hash = crypto.createHmac("sha512", secret).update(body).digest("hex");
  if (hash !== signature)
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  const event = JSON.parse(body);

  // 1b. Log Event (Non-blocking / Safe)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let webhookEvent: any = null;
  try {
    webhookEvent = await WebhookEvent.create({
      provider: "paystack",
      eventType: event.event,
      payload: event,
      processingStatus: "processing",
      processingHistory: [
        { status: "processing", message: "Signature verified" },
      ],
    });
  } catch (error) {
    console.error("Failed to create webhook event log:", error);
    // Continue processing even if logging fails
  }

  try {
    if (event.event === "charge.success") {
      const reference = event.data.reference;

      // 2. Idempotency Check
      const existing = await WalletTransaction.findOne({
        providerReference: reference,
        status: "confirmed",
      });
      if (existing) {
        if (webhookEvent) {
          webhookEvent.processingStatus = "processed";
          webhookEvent.processingHistory.push({
            status: "skipped",
            message: "Transaction already processed",
          });
          await webhookEvent
            .save()
            .catch((e: unknown) =>
              console.error("Failed to save webhook log:", e)
            );
        }
        return NextResponse.json({ message: "Already processed" });
      }

      // 3. Update Transaction & User Credits
      const transaction = await WalletTransaction.findOne({
        providerReference: reference,
      });

      if (transaction) {
        transaction.status = "confirmed";
        // Enrich Data
        if (event.data.customer) {
          transaction.metadata = {
            ...transaction.metadata,
            customer: {
              email: event.data.customer.email,
              first_name: event.data.customer.first_name,
              last_name: event.data.customer.last_name,
              phone: event.data.customer.phone,
              customer_code: event.data.customer.customer_code,
            },
            channel: event.data.channel,
            ip_address: event.data.ip_address,
            paid_at: event.data.paid_at,
          };
        }
        await transaction.save();

        const creditsToGive = transaction.metadata?.credits || 0;

        if (creditsToGive > 0) {
          await User.findByIdAndUpdate(
            transaction.userId,
            { $inc: { credits: creditsToGive } },
            { new: true }
          );
        }

        if (webhookEvent) {
          webhookEvent.relatedTransactionId = transaction._id;
          webhookEvent.processingStatus = "processed";
          webhookEvent.processingHistory.push({
            status: "success",
            message: "Transaction confirmed and credits added",
          });
        }
      } else {
        if (webhookEvent) {
          webhookEvent.processingStatus = "failed";
          webhookEvent.processingHistory.push({
            status: "failed",
            message: "Transaction reference not found",
          });
        }
      }
    } else {
      if (webhookEvent) {
        webhookEvent.processingStatus = "processed";
        webhookEvent.processingHistory.push({
          status: "ignored",
          message: "Event type not handled",
        });
      }
    }
  } catch (error) {
    if (webhookEvent) {
      if (error instanceof Error) {
        webhookEvent.processingStatus = "failed";
        webhookEvent.processingHistory.push({
          status: "error",
          message: error.message,
        });
      } else {
        webhookEvent.processingStatus = "failed";
        webhookEvent.processingHistory.push({
          status: "error",
          message: "Unknown error",
        });
      }
    }
  }

  if (webhookEvent) {
    await webhookEvent
      .save()
      .catch((e: unknown) => console.error("Final webhook save failed:", e));
  }
  return NextResponse.json({ received: true });
}
