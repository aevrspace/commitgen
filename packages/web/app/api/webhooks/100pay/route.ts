import { NextResponse } from "next/server";
import { Transaction } from "@/models/Transaction";
import { Wallet } from "@/models/Wallet";
import { createWebhookEventLogger } from "@/services/webhookEventLogger";
import dbConnect from "@/lib/db";
import { calculateDepositCredits } from "@/utils/billing";

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
    await dbConnect();

    if (event.type === "credit") {
      const reference = event.data.charge.metadata.ref_id;

      // 2. Find and update Transaction
      const transaction = await Transaction.findOne({
        providerReference: reference,
      });

      if (transaction && transaction.status !== "successful") {
        // Get credits from metadata or amount field
        const expectedCredits =
          transaction.metadata?.credits || transaction.amount || 0;

        // Calculate actual credits based on payment
        // Default to expected if paid amount isn't available (should be for 100pay)
        let creditsToCredit = expectedCredits;

        const charge = event.data.charge;
        const paidAmount = charge?.status?.total_paid;
        const billingAmount = parseFloat(charge?.billing?.amount || "0");

        if (typeof paidAmount === "number" && billingAmount > 0) {
          creditsToCredit = calculateDepositCredits(
            paidAmount,
            billingAmount,
            expectedCredits
          );
        }

        // Ensure wallet exists
        const wallet = await Wallet.getOrCreate(transaction.user, "CREDITS");
        transaction.wallet = wallet._id;

        // Update transaction with new schema properties
        transaction.status = "successful";
        transaction.type = "credit";
        transaction.symbol = "CREDITS";
        transaction.category = "deposit";
        transaction.channel = "100pay";
        transaction.amount = creditsToCredit;

        // Enrich with customer data
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

        eventLogger.linkTransaction(transaction._id.toString());
        eventLogger.success(
          `Transaction confirmed: ${creditsToCredit} credits added to wallet`
        );
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
