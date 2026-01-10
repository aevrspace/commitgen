import { NextResponse } from "next/server";
import { Transaction } from "@/models/Transaction";
import dbConnect from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference");

  if (!reference) {
    return NextResponse.json({ error: "Reference required" }, { status: 400 });
  }

  try {
    await dbConnect();

    const transaction = await Transaction.findOne({
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
      credits: transaction.amount, // For CREDITS wallet, amount = credits
      symbol: transaction.symbol,
    });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
