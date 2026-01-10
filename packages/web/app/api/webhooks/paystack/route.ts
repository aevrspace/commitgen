import { NextResponse } from "next/server";
import crypto from "crypto";
import { WalletTransaction } from "@/models/WalletTransaction";
import User from "@/models/User";
import { createWebhookEventLogger } from "@/services/webhookEventLogger";

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY!;
  const signature = request.headers.get("x-paystack-signature");
  const body = await request.text();

  // 1. Verify Signature
  const hash = crypto.createHmac("sha512", secret).update(body).digest("hex");
  if (hash !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);

  // 1b. Log Event (Non-blocking, Resilient)
  const eventLogger = createWebhookEventLogger();
  eventLogger.create({
    provider: "paystack",
    eventType: event.event,
    payload: event,
    initialHistory: [{ status: "processing", message: "Signature verified" }],
  });

  try {
    if (event.event === "charge.success") {
      const reference = event.data.reference;

      // 2. Idempotency Check
      const existing = await WalletTransaction.findOne({
        providerReference: reference,
        status: "confirmed",
      });

      if (existing) {
        eventLogger.skip("Transaction already processed");
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

        eventLogger.linkTransaction(transaction._id.toString());
        eventLogger.success("Transaction confirmed and credits added");
      } else {
        eventLogger.fail("Transaction reference not found");
      }
    } else {
      eventLogger.skip("Event type not handled");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    eventLogger.fail(message);
  }

  return NextResponse.json({ received: true });
}
