import { NextResponse } from "next/server";
import { WalletTransaction } from "@/models/WalletTransaction";
import User from "@/models/User";
import { WebhookEvent } from "@/models/WebhookEvent";

export async function POST(request: Request) {
  const verificationToken = request.headers.get("verification-token");

  // 1. Verify Token
  if (verificationToken !== process.env.HUNDREDPAY_VERIFICATION_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const event = await request.json();

  // 1b. Log Event (Non-blocking / Safe)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let webhookEvent: any = null;
  try {
    webhookEvent = await WebhookEvent.create({
      provider: "100pay",
      eventType: event.type,
      payload: event,
      processingStatus: "processing",
      processingHistory: [{ status: "processing", message: "Token verified" }],
    });
  } catch (error) {
    console.error("Failed to create webhook event log:", error);
    // Continue processing
  }

  try {
    // Check event type - docs say 'charge.completed' or similar?
    // Guide says: if (event.type === "credit")
    if (event.type === "credit") {
      const reference = event.data.charge.metadata.ref_id;
      // const amount = parseFloat(event.data.charge.billing.amount);

      // 2. Update Transaction
      const transaction = await WalletTransaction.findOne({
        providerReference: reference,
      });

      if (transaction && transaction.status !== "confirmed") {
        transaction.status = "confirmed";
        // Enrich Data
        if (event.data.charge?.customer) {
          const customer = event.data.charge.customer;
          transaction.metadata = {
            ...transaction.metadata,
            customer: {
              email: customer.email,
              name: customer.name,
              phone: customer.phone,
              user_id: customer.user_id,
            },
            transaction_id: event.data.transaction_id,
            charge_source: event.data.charge.charge_source,
            billing: event.data.charge.billing,
          };
        }
        await transaction.save();

        // 3. Update User Credits
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
      } else if (transaction) {
        if (webhookEvent) {
          webhookEvent.relatedTransactionId = transaction._id;
          webhookEvent.processingStatus = "processed";
          webhookEvent.processingHistory.push({
            status: "skipped",
            message: "Transaction already confirmed",
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
