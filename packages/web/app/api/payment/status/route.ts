import { NextResponse } from "next/server";
import { WalletTransaction } from "@/models/WalletTransaction";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference");

  if (!reference) {
    return NextResponse.json({ error: "Reference required" }, { status: 400 });
  }

  try {
    const transaction = await WalletTransaction.findOne({
      providerReference: reference,
    });
    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: transaction.status,
      amount: transaction.amount,
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
