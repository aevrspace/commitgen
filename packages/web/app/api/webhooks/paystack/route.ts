import { NextResponse } from "next/server";
import crypto from "crypto";
import { Transaction } from "@/models/Transaction";
import { Wallet } from "@/models/Wallet";
import { createWebhookEventLogger } from "@/services/webhookEventLogger";
import dbConnect from "@/lib/db";

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
    await dbConnect();

    if (event.event === "charge.success") {
      const reference = event.data.reference;

      // 2. Idempotency Check
      const existing = await Transaction.findOne({
        providerReference: reference,
        status: "successful",
      });

      if (existing) {
        eventLogger.skip("Transaction already processed");
        return NextResponse.json({ message: "Already processed" });
      }

      // 3. Find and confirm the transaction
      const transaction = await Transaction.findOne({
        providerReference: reference,
      });

      if (transaction) {
        // Get credits from metadata or amount field
        const creditsToCredit =
          transaction.metadata?.credits || transaction.amount || 0;

        // Ensure wallet exists
        const wallet = await Wallet.getOrCreate(transaction.user, "CREDITS");
        transaction.wallet = wallet._id;

        // Update transaction with new schema properties
        transaction.status = "successful";
        transaction.type = "credit";
        transaction.symbol = "CREDITS";
        transaction.category = "deposit";
        transaction.channel = "paystack";
        transaction.amount = creditsToCredit;

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

        eventLogger.linkTransaction(transaction._id.toString());
        eventLogger.success(
          `Transaction confirmed: ${creditsToCredit} credits added to wallet`
        );
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
