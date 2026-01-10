import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import dbConnect from "@/lib/db";
import AuthToken from "@/models/AuthToken";
import { WalletTransaction } from "@/models/WalletTransaction";
import {
  initializePaystackPayment,
  CREDITS_PER_USD,
  USD_TO_NGN_RATE,
} from "@/lib/payment";
import { nanoid } from "nanoid";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amountOfCredits, provider = "paystack" } = body;
    let { userId, email } = body;

    // Authentication Check
    await dbConnect();

    let token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get("authToken")?.value;
    }

    if (token) {
      const authToken = await AuthToken.findOne({ token });
      if (authToken && authToken.expiresAt > new Date()) {
        userId = authToken.userId;
        const user = await User.findById(userId);
        if (user) {
          email = user.email;
        }
      }
    }

    if (!amountOfCredits || !email || !userId) {
      return NextResponse.json(
        { error: "Authentication failed or missing required fields" },
        { status: 401 }
      );
    }

    const priceInUsd = amountOfCredits / CREDITS_PER_USD;
    const priceInNgn = priceInUsd * USD_TO_NGN_RATE;

    // For 100Pay, we just create the transaction reference and return it for the frontend to use
    if (provider === "100pay") {
      const reference = nanoid();
      await WalletTransaction.create({
        userId,
        type: "deposit",
        amount: amountOfCredits, // We store credits amount or money? Let's store CREDITS amount in metadata or assume amount is money?
        // The WalletTransaction model has `amount` which usually implies currency.
        // But here we are buying CREDITS.
        // Let's store the PRICE in the transaction amount, and credits in metadata.
        fee: 0,
        status: "pending",
        providerReference: reference,
        metadata: { provider: "100pay", credits: amountOfCredits, priceInNgn },
      });

      return NextResponse.json({
        success: true,
        data: {
          ref_id: reference,
          amount: priceInNgn,
          email,
          userId,
        },
      });
    }

    // Paystack
    const reference = crypto.randomBytes(16).toString("hex");

    // 1. Create Pending Transaction
    await WalletTransaction.create({
      userId,
      type: "deposit",
      amount: priceInNgn,
      status: "pending",
      providerReference: reference,
      metadata: { provider: "paystack", credits: amountOfCredits },
    });

    // 2. Initialize with Paystack
    const data = await initializePaystackPayment(email, priceInNgn, reference);

    if (!data.status) {
      console.error("Paystack init error:", data);
      return NextResponse.json(
        { error: "Initialization failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      authorizationUrl: data.data.authorization_url,
      reference,
    });
  } catch (error) {
    console.error("Payment init error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
