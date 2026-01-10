import { NextResponse } from "next/server";
import { WalletTransaction } from "@/models/WalletTransaction";
import User from "@/models/User";
import { createWebhookEventLogger } from "@/services/webhookEventLogger";

export async function POST(request: Request) {
  const verificationToken = request.headers.get("verification-token");

  // 1. Verify Token
  if (verificationToken !== process.env.HUNDREDPAY_VERIFICATION_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const event = await request.json();

  // 1b. Log Event (Non-blocking, Resilient)
  const eventLogger = createWebhookEventLogger();
  eventLogger.create({
    provider: "100pay",
    eventType: event.type,
    payload: event,
    initialHistory: [{ status: "processing", message: "Token verified" }],
  });

  try {
    if (event.type === "credit") {
      const reference = event.data.charge.metadata.ref_id;

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

        eventLogger.linkTransaction(transaction._id.toString());
        eventLogger.success("Transaction confirmed and credits added");
      } else if (transaction) {
        eventLogger.linkTransaction(transaction._id.toString());
        eventLogger.skip("Transaction already confirmed");
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
