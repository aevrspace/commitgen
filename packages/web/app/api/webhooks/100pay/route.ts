import { NextResponse } from "next/server";
import { WalletTransaction } from "@/models/WalletTransaction";
import User from "@/models/User";

export async function POST(request: Request) {
  const verificationToken = request.headers.get("verification-token");

  // 1. Verify Token
  if (verificationToken !== process.env.HUNDREDPAY_VERIFICATION_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const event = await request.json();

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
    }
  }

  return NextResponse.json({ received: true });
}
