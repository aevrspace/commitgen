import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import dbConnect from "@/lib/db";
import AuthToken from "@/models/AuthToken";
import { WalletTransaction } from "@/models/WalletTransaction";
import {
  initializePaystackPayment,
  CREDITS_PER_USD,
  // USD_TO_NGN_RATE, // Deprecated in favor of dynamic
} from "@/lib/payment";
import { nanoid } from "nanoid";
import User from "@/models/User";
import { createCurrencyService } from "@/utils/currency/currency.service";
import { HttpClient } from "@/utils/shared/httpClient";
import { calculatePaystackTotal } from "@/utils/paystack/fees";

const currencyService = createCurrencyService(
  new HttpClient({ baseUrl: "https://api.currencyfreaks.com" }),
  process.env.NEXT_PUBLIC_CURRENCY_API_KEY || ""
);

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

    // Fetch Dynamic Rate
    let ngnRate = 1500; // Fallback
    try {
      const rates = await currencyService.getLatestRates("NGN");
      if (rates.rates["NGN"]) {
        ngnRate = parseFloat(rates.rates["NGN"]);
      }
    } catch (e) {
      console.error("Failed to fetch dynamic rate, using fallback", e);
    }

    const priceInNgn = priceInUsd * ngnRate;

    // For 100Pay, create pending credit transaction
    if (provider === "100pay") {
      const reference = nanoid();
      await WalletTransaction.create({
        userId,
        type: "credit", // Credit type for deposits
        credits: amountOfCredits, // Store credits directly
        amount: priceInNgn, // Monetary amount
        fee: 0,
        status: "pending",
        providerReference: reference,
        metadata: { provider: "100pay", priceInNgn },
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
    // Calculate total amount to charge user (Price + Fees)
    const finalChargeAmount = calculatePaystackTotal(priceInNgn);
    const fee = finalChargeAmount - priceInNgn;

    const reference = crypto.randomBytes(16).toString("hex");

    // Paystack - Create Pending Credit Transaction
    await WalletTransaction.create({
      userId,
      type: "credit", // Credit type for deposits
      credits: amountOfCredits, // Store credits directly
      amount: finalChargeAmount, // Total monetary amount charged
      fee: fee, // The fee portion
      status: "pending",
      providerReference: reference,
      metadata: {
        provider: "paystack",
        netAmount: priceInNgn,
      },
    });

    // 2. Initialize with Paystack (Charge the total)
    const data = await initializePaystackPayment(
      email,
      finalChargeAmount,
      reference
    );

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
