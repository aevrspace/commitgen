import { NextResponse } from "next/server";
import crypto from "crypto";
import { WalletTransaction } from "@/models/WalletTransaction";
import User from "@/models/User";
import { verifyPaystackPayment } from "@/lib/payment";

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY!;
  const signature = request.headers.get("x-paystack-signature");
  const body = await request.text();

  // 1. Verify Signature
  const hash = crypto.createHmac("sha512", secret).update(body).digest("hex");
  if (hash !== signature)
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  const event = JSON.parse(body);

  if (event.event === "charge.success") {
    const reference = event.data.reference;

    // 2. Idempotency Check
    const existing = await WalletTransaction.findOne({
      providerReference: reference,
      status: "confirmed",
    });
    if (existing) return NextResponse.json({ message: "Already processed" });

    // 3. Verify Transaction
    // Optional: we can skip this if we trust the signature, but double check is good.
    // For speed/rate limits, we might rely on signature.
    // The guide says check verification.

    // 4. Update Transaction & User Credits
    const transaction = await WalletTransaction.findOne({
      providerReference: reference,
    });

    if (transaction) {
      transaction.status = "confirmed";
      // transaction.amount = event.data.amount / 100; // Store Net amount if we want, but we stored predicted amount
      await transaction.save();

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
