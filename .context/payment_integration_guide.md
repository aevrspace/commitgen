# Payment Integration Guide: Complete Deep Dive

A production-ready implementation guide for **Paystack** and **100Pay** payment gateways in a Next.js application with MongoDB. This guide covers the complete payment lifecycle including credits systems, fee calculations, webhook handling, and best practices.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Environment Setup](#2-environment-setup)
3. [Database Schema](#3-database-schema)
4. [Wallet Model](#4-wallet-model)
5. [Transaction Model](#5-transaction-model)
6. [Wallet Service](#6-wallet-service)
7. [Payment Initialization](#7-payment-initialization)
8. [Paystack Implementation](#8-paystack-implementation)
9. [100Pay Implementation](#9-100pay-implementation)
10. [Webhook Handling](#10-webhook-handling)
11. [Payment Callback Page](#11-payment-callback-page)
12. [Frontend Integration](#12-frontend-integration)
13. [Fee Calculation](#13-fee-calculation)
14. [Best Practices](#14-best-practices)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PAYMENT FLOW                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   User → Credits Page → Payment Initialize API → Create Pending Transaction │
│                              ↓                                              │
│            ┌─────────────────┴─────────────────┐                           │
│            │                                   │                           │
│      [Paystack]                          [100Pay]                          │
│            │                                   │                           │
│   Redirect to Paystack              Open 100Pay Modal                      │
│   Authorization URL                      on Frontend                       │
│            │                                   │                           │
│   User Completes Payment              User Completes Payment               │
│            │                                   │                           │
│   Redirect to /callback              Callback triggers onPayment           │
│            │                                   │                           │
│            └─────────────────┬─────────────────┘                           │
│                              ↓                                              │
│                     Webhook Received                                        │
│                              ↓                                              │
│            Verify Signature/Token + Find Transaction                       │
│                              ↓                                              │
│            Update Transaction Status → "successful"                        │
│                              ↓                                              │
│                   Balance Calculated from Transactions                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key Principles:**

- **Transaction-Based Balance**: No stored balance field; calculated from sum of credits/debits
- **Pending → Successful**: Transactions start pending, webhooks confirm them
- **Idempotency**: Webhooks check if already processed before updating
- **Audit Trail**: Every payment creates a Transaction record

---

## 2. Environment Setup

### Required Environment Variables

```env
# Paystack
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx

# 100Pay
NEXT_PUBLIC_HUNDREDPAY_API_KEY=your_api_key
HUNDREDPAY_VERIFICATION_TOKEN=your_custom_webhook_verification_token

# Currency API (for dynamic exchange rates)
NEXT_PUBLIC_CURRENCY_API_KEY=your_currencyfreaks_api_key

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Production: https://yourdomain.com
MONGODB_URI=mongodb://localhost:27017/your_db
```

### Dependencies

```bash
npm install mongoose nanoid @100pay-hq/checkout crypto iso-country-currency zustand
```

---

## 3. Database Schema

### Schema Design Principles

1. **Separation of Concerns**: Wallet (balance holder) vs Transaction (movement record)
2. **Calculated Balance**: Balance = SUM(credits) - SUM(debits) from transactions
3. **Multi-Currency Support**: `symbol` field supports fiat and crypto
4. **Audit-Ready**: `category`, `channel`, `metadata` for complete tracking

---

## 4. Wallet Model

**File**: `models/Wallet.ts`

```typescript
import { Schema, model, models, Model, Document, Types } from "mongoose";
import { Transaction } from "./Transaction";

export interface IWallet extends Document {
  user: Types.ObjectId;
  symbol: string;
  createdAt: Date;
  updatedAt: Date;
}

interface IWalletModel extends Model<IWallet> {
  getBalance(walletId: Types.ObjectId | string): Promise<number>;
  getOrCreate(
    userId: Types.ObjectId | string,
    symbol: string
  ): Promise<IWallet>;
}

const SUPPORTED_SYMBOLS = [
  // Fiat
  "NGN",
  "USD",
  "EUR",
  "GBP",
  // Crypto
  "BTC",
  "ETH",
  "USDC",
  "USDT",
  "PAY",
  // Internal
  "CREDITS",
] as const;

const WalletSchema = new Schema<IWallet>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    symbol: {
      type: String,
      enum: SUPPORTED_SYMBOLS,
      required: true,
    },
  },
  { timestamps: true }
);

// One wallet per user per symbol
WalletSchema.index({ user: 1, symbol: 1 }, { unique: true });

/**
 * Calculate balance by aggregating all successful transactions.
 * Credits add to balance, debits subtract.
 */
WalletSchema.statics.getBalance = async function (
  walletId: Types.ObjectId | string
): Promise<number> {
  const result = await Transaction.aggregate([
    {
      $match: {
        wallet: new Types.ObjectId(walletId),
        status: "successful",
      },
    },
    {
      $group: {
        _id: null,
        balance: {
          $sum: {
            $cond: [
              { $eq: ["$type", "credit"] },
              "$amount",
              { $multiply: ["$amount", -1] },
            ],
          },
        },
      },
    },
  ]);

  return result.length > 0 ? result[0].balance : 0;
};

/**
 * Get existing wallet or create new one.
 */
WalletSchema.statics.getOrCreate = async function (
  userId: Types.ObjectId | string,
  symbol: string
): Promise<IWallet> {
  let wallet = await this.findOne({ user: userId, symbol });
  if (!wallet) {
    wallet = await this.create({ user: userId, symbol });
  }
  return wallet;
};

export const Wallet: IWalletModel =
  (models.Wallet as IWalletModel) ||
  model<IWallet, IWalletModel>("Wallet", WalletSchema);

export { SUPPORTED_SYMBOLS };
```

---

## 5. Transaction Model

**File**: `models/Transaction.ts`

```typescript
import { Schema, model, models, Document, Types } from "mongoose";

export interface ITransaction extends Document {
  type: "credit" | "debit";
  status: "pending" | "successful" | "failed" | "reversed";
  symbol: string;
  user: Types.ObjectId;
  wallet: Types.ObjectId;
  category: "deposit" | "usage" | "transfer" | "withdrawal" | "bonus";
  channel?: string;
  amount: number;
  fee: number;
  providerReference?: string;
  usageRef?: Types.ObjectId;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const SUPPORTED_SYMBOLS = [
  "NGN",
  "USD",
  "EUR",
  "GBP",
  "BTC",
  "ETH",
  "USDC",
  "USDT",
  "PAY",
  "CREDITS",
] as const;

const TRANSACTION_TYPES = ["credit", "debit"] as const;
const TRANSACTION_STATUSES = [
  "pending",
  "successful",
  "failed",
  "reversed",
] as const;
const TRANSACTION_CATEGORIES = [
  "deposit",
  "usage",
  "transfer",
  "withdrawal",
  "bonus",
] as const;
const TRANSACTION_CHANNELS = [
  "100pay",
  "paystack",
  "internal",
  "system",
] as const;

const TransactionSchema = new Schema<ITransaction>(
  {
    type: {
      type: String,
      enum: TRANSACTION_TYPES,
      required: true,
    },
    status: {
      type: String,
      enum: TRANSACTION_STATUSES,
      default: "pending",
    },
    symbol: {
      type: String,
      enum: SUPPORTED_SYMBOLS,
      required: true,
    },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    wallet: { type: Schema.Types.ObjectId, ref: "Wallet", required: true },
    category: {
      type: String,
      enum: TRANSACTION_CATEGORIES,
      required: true,
    },
    channel: {
      type: String,
      enum: TRANSACTION_CHANNELS,
    },
    amount: { type: Number, required: true, default: 0 },
    fee: { type: Number, default: 0 },
    providerReference: { type: String, unique: true, sparse: true },
    usageRef: { type: Schema.Types.ObjectId, ref: "CreditUsage" },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Indexes for efficient queries
TransactionSchema.index({ wallet: 1, status: 1, type: 1 });
TransactionSchema.index({ user: 1, status: 1, type: 1 });
TransactionSchema.index({ user: 1, createdAt: -1 });
TransactionSchema.index({ providerReference: 1 });

export const Transaction =
  models.Transaction || model<ITransaction>("Transaction", TransactionSchema);

export {
  SUPPORTED_SYMBOLS,
  TRANSACTION_TYPES,
  TRANSACTION_STATUSES,
  TRANSACTION_CATEGORIES,
  TRANSACTION_CHANNELS,
};
```

### Transaction Properties Explained

| Property            | Purpose                                                       |
| ------------------- | ------------------------------------------------------------- |
| `type`              | Direction: `credit` (adds) or `debit` (subtracts)             |
| `status`            | Lifecycle: `pending` → `successful`/`failed`/`reversed`       |
| `symbol`            | Currency/asset type (CREDITS for internal credits)            |
| `category`          | Business context: deposit, usage, transfer, withdrawal, bonus |
| `channel`           | Payment provider: 100pay, paystack, internal, system          |
| `amount`            | Quantity in the symbol's unit (e.g., number of credits)       |
| `fee`               | Associated fees (for auditing)                                |
| `providerReference` | Unique ID from payment provider for idempotency               |
| `metadata`          | Flexible JSON for additional data (customer info, etc.)       |

---

## 6. Wallet Service

**File**: `services/walletService.ts`

```typescript
import { Transaction } from "@/models/Transaction";
import { Wallet } from "@/models/Wallet";
import { CreditUsage } from "@/models/CreditUsage";
import { nanoid } from "nanoid";
import mongoose from "mongoose";

interface DebitOptions {
  type: "commit_generation" | "api_call" | "other";
  creditsUsed?: number;
  metadata?: Record<string, unknown>;
}

interface CreditOptions {
  credits: number;
  providerReference: string;
  channel: "100pay" | "paystack" | "internal" | "system";
  category?: "deposit" | "bonus";
  amount?: number;
  fee?: number;
  metadata?: Record<string, unknown>;
}

class WalletService {
  /**
   * Get or create a CREDITS wallet for a user.
   */
  async getCreditsWallet(userId: string) {
    return await Wallet.getOrCreate(userId, "CREDITS");
  }

  /**
   * Get the current credit balance for a user.
   */
  async getBalance(userId: string): Promise<number> {
    const wallet = await this.getCreditsWallet(userId);
    return await Wallet.getBalance(wallet._id);
  }

  /**
   * Check if user has sufficient balance.
   */
  async hasBalance(userId: string, requiredCredits: number): Promise<boolean> {
    const balance = await this.getBalance(userId);
    return balance >= requiredCredits;
  }

  /**
   * Debit credits for usage (e.g., API calls).
   */
  async debit(userId: string, options: DebitOptions) {
    const { type, creditsUsed = 1, metadata = {} } = options;
    const wallet = await this.getCreditsWallet(userId);

    // Create usage record
    const usage = await CreditUsage.create({
      userId,
      type,
      creditsUsed,
      metadata: { ...metadata, requestId: metadata.requestId || nanoid() },
    });

    // Create debit transaction (immediately successful)
    const transaction = await Transaction.create({
      user: userId,
      wallet: wallet._id,
      type: "debit",
      status: "successful",
      symbol: "CREDITS",
      category: "usage",
      channel: "internal",
      amount: creditsUsed,
      fee: 0,
      providerReference: `usage-${usage._id.toString()}`,
      usageRef: usage._id,
      metadata: { usageType: type, ...metadata },
    });

    usage.transactionRef = transaction._id;
    await usage.save();

    return { transaction, usage };
  }

  /**
   * Credit user (after payment confirmation).
   */
  async credit(userId: string, options: CreditOptions) {
    const {
      credits,
      providerReference,
      channel,
      category = "deposit",
      metadata = {},
    } = options;
    const wallet = await this.getCreditsWallet(userId);

    return await Transaction.create({
      user: userId,
      wallet: wallet._id,
      type: "credit",
      status: "successful",
      symbol: "CREDITS",
      category,
      channel,
      amount: credits,
      fee: 0,
      providerReference,
      metadata,
    });
  }

  /**
   * Create pending deposit (before payment confirmation).
   */
  async createPendingCredit(userId: string, options: CreditOptions) {
    const {
      credits,
      providerReference,
      channel,
      category = "deposit",
      metadata = {},
    } = options;
    const wallet = await this.getCreditsWallet(userId);

    return await Transaction.create({
      user: userId,
      wallet: wallet._id,
      type: "credit",
      status: "pending",
      symbol: "CREDITS",
      category,
      channel,
      amount: credits,
      fee: 0,
      providerReference,
      metadata,
    });
  }

  /**
   * Get transaction history.
   */
  async getHistory(
    userId: string,
    options: { page?: number; limit?: number } = {}
  ) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      Transaction.find({ user: new mongoose.Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments({ user: new mongoose.Types.ObjectId(userId) }),
    ]);

    return { transactions, total, page, limit };
  }
}

export const createWalletService = () => new WalletService();
```

---

## 7. Payment Initialization

**File**: `app/api/payment/initialize/route.ts`

This endpoint creates a pending transaction and initializes payment with the provider.

```typescript
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import dbConnect from "@/lib/db";
import AuthToken from "@/models/AuthToken";
import { Transaction } from "@/models/Transaction";
import { Wallet } from "@/models/Wallet";
import { initializePaystackPayment, CREDITS_PER_USD } from "@/lib/payment";
import { nanoid } from "nanoid";
import crypto from "crypto";
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

    await dbConnect();

    // Authenticate user
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
        if (user) email = user.email;
      }
    }

    if (!amountOfCredits || !email || !userId) {
      return NextResponse.json(
        { error: "Authentication failed or missing required fields" },
        { status: 401 }
      );
    }

    // Calculate price in USD then NGN
    const priceInUsd = amountOfCredits / CREDITS_PER_USD;

    // Fetch dynamic NGN rate
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

    // Get or create CREDITS wallet
    const wallet = await Wallet.getOrCreate(userId, "CREDITS");

    // Provider-specific logic
    if (provider === "100pay") {
      const reference = nanoid();

      await Transaction.create({
        user: userId,
        wallet: wallet._id,
        type: "credit",
        status: "pending",
        symbol: "CREDITS",
        category: "deposit",
        channel: "100pay",
        amount: amountOfCredits,
        fee: 0,
        providerReference: reference,
        metadata: {
          provider: "100pay",
          priceInNgn,
          credits: amountOfCredits, // CRITICAL: Store for webhook
        },
      });

      return NextResponse.json({
        success: true,
        data: { ref_id: reference, amount: priceInNgn, email, userId },
      });
    }

    // Paystack - Include fees in charge
    const finalChargeAmount = calculatePaystackTotal(priceInNgn);
    const fee = finalChargeAmount - priceInNgn;
    const reference = crypto.randomBytes(16).toString("hex");

    await Transaction.create({
      user: userId,
      wallet: wallet._id,
      type: "credit",
      status: "pending",
      symbol: "CREDITS",
      category: "deposit",
      channel: "paystack",
      amount: amountOfCredits,
      fee: fee,
      providerReference: reference,
      metadata: {
        provider: "paystack",
        netAmount: priceInNgn,
        chargeAmount: finalChargeAmount,
        credits: amountOfCredits, // CRITICAL: Store for webhook
      },
    });

    const data = await initializePaystackPayment(
      email,
      finalChargeAmount,
      reference
    );

    if (!data.status) {
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
```

---

## 8. Paystack Implementation

### Utility Functions

**File**: `lib/payment.ts`

```typescript
export const CREDITS_PER_USD = 80;

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

export async function initializePaystackPayment(
  email: string,
  amount: number,
  reference: string
) {
  const response = await fetch(
    "https://api.paystack.co/transaction/initialize",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: Math.ceil(amount * 100), // Convert to kobo
        reference,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/callback`,
      }),
    }
  );
  return await response.json();
}

export async function verifyPaystackPayment(reference: string) {
  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
    }
  );
  return await response.json();
}
```

---

## 9. 100Pay Implementation

### Frontend Utility

**File**: `utils/payWith100Pay.ts`

```typescript
import { shop100Pay } from "@100pay-hq/checkout";
import { nanoid } from "nanoid";

interface PayWith100PayData {
  apiKey: string;
  billing: { amount: number; currency?: string };
  customer: { email: string; name: string; user_id: string; phone?: string };
  metadata: Record<string, unknown>;
}

export const payWith100Pay = async (
  data: PayWith100PayData,
  onClose: () => void,
  onError: (error: unknown) => void,
  onCallback: (reference: string) => void
) => {
  shop100Pay.setup({
    ref_id: nanoid(),
    api_key: data.apiKey,
    billing: {
      amount: data.billing.amount,
      currency: "NGN",
      pricing_type: "fixed_price",
      description: "App Credits",
      country: "NG",
    },
    customer: {
      email: data.customer.email,
      name: data.customer.name,
      user_id: data.customer.user_id,
      phone: data.customer.phone || "0000000000",
    },
    metadata: data.metadata,
    onClose,
    onError,
    callback: onCallback,
    call_back_url: "http://localhost:3000/credits",
    onPayment: () => {},
  });
};
```

---

## 10. Webhook Handling

### Paystack Webhook

**File**: `app/api/webhooks/paystack/route.ts`

```typescript
import { NextResponse } from "next/server";
import crypto from "crypto";
import { Transaction } from "@/models/Transaction";
import { Wallet } from "@/models/Wallet";
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
        return NextResponse.json({ message: "Already processed" });
      }

      // 3. Find and confirm transaction
      const transaction = await Transaction.findOne({
        providerReference: reference,
      });

      if (transaction) {
        const creditsToCredit =
          transaction.metadata?.credits || transaction.amount || 0;

        // Ensure wallet exists
        const wallet = await Wallet.getOrCreate(transaction.user, "CREDITS");
        transaction.wallet = wallet._id;

        // Update with new schema properties
        transaction.status = "successful";
        transaction.type = "credit";
        transaction.symbol = "CREDITS";
        transaction.category = "deposit";
        transaction.channel = "paystack";
        transaction.amount = creditsToCredit;

        // Enrich with customer data
        if (event.data.customer) {
          transaction.metadata = {
            ...transaction.metadata,
            customer: {
              email: event.data.customer.email,
              first_name: event.data.customer.first_name,
              last_name: event.data.customer.last_name,
            },
            paid_at: event.data.paid_at,
          };
        }

        await transaction.save();
      }
    }
  } catch (error) {
    console.error("Webhook error:", error);
  }

  return NextResponse.json({ received: true });
}
```

### 100Pay Webhook

**File**: `app/api/webhooks/100pay/route.ts`

```typescript
import { NextResponse } from "next/server";
import { Transaction } from "@/models/Transaction";
import { Wallet } from "@/models/Wallet";
import dbConnect from "@/lib/db";

export async function POST(request: Request) {
  const verificationToken = request.headers.get("verification-token");

  // 1. Verify Token
  if (verificationToken !== process.env.HUNDREDPAY_VERIFICATION_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const event = await request.json();

  try {
    await dbConnect();

    if (event.type === "credit") {
      const reference = event.data.charge.metadata.ref_id;

      const transaction = await Transaction.findOne({
        providerReference: reference,
      });

      if (transaction && transaction.status !== "successful") {
        const creditsToCredit =
          transaction.metadata?.credits || transaction.amount || 0;

        const wallet = await Wallet.getOrCreate(transaction.user, "CREDITS");
        transaction.wallet = wallet._id;

        transaction.status = "successful";
        transaction.type = "credit";
        transaction.symbol = "CREDITS";
        transaction.category = "deposit";
        transaction.channel = "100pay";
        transaction.amount = creditsToCredit;

        if (event.data.charge?.customer) {
          transaction.metadata = {
            ...transaction.metadata,
            customer: event.data.charge.customer,
          };
        }

        await transaction.save();
      }
    }
  } catch (error) {
    console.error("Webhook error:", error);
  }

  return NextResponse.json({ received: true });
}
```

---

## 11. Payment Callback Page

**File**: `app/callback/page.tsx`

Handles Paystack redirect after payment.

```tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("Verifying payment...");

  const reference = searchParams.get("reference") || searchParams.get("trxref");

  const verifyPayment = useCallback(async () => {
    if (!reference) return;

    try {
      const res = await fetch(`/api/payment/status?reference=${reference}`);
      const data = await res.json();

      if (data.status === "successful") {
        setStatus("success");
        setMessage("Payment successful! Redirecting...");
        setTimeout(() => router.push("/credits?payment=success"), 1500);
      } else if (data.status === "pending") {
        setMessage("Payment is being processed...");
        setTimeout(verifyPayment, 3000); // Retry
      } else {
        setStatus("error");
        setMessage(data.error || "Payment verification failed");
      }
    } catch (error) {
      setStatus("error");
      setMessage("Failed to verify payment.");
    }
  }, [reference, router]);

  useEffect(() => {
    if (!reference) {
      setStatus("error");
      setMessage("No payment reference found");
      return;
    }
    verifyPayment();
  }, [reference, verifyPayment]);

  // ... render UI based on status
}
```

---

## 12. Frontend Integration

### Credits Page Example

```tsx
const handleDeposit = async () => {
  const res = await fetch("/api/payment/initialize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amountOfCredits: calculatedCredits,
      email: user.email,
      userId: user.id,
      provider, // "paystack" or "100pay"
    }),
  });

  const data = await res.json();

  if (provider === "paystack") {
    // Redirect to Paystack
    window.location.href = data.authorizationUrl;
  } else {
    // Open 100Pay modal
    payWith100Pay(
      {
        apiKey: process.env.NEXT_PUBLIC_HUNDREDPAY_API_KEY || "",
        billing: { amount: data.data.amount },
        customer: { email: user.email, name: user.email, user_id: user.id },
        metadata: { ref_id: data.data.ref_id, credits: calculatedCredits },
      },
      () => console.log("Closed"),
      (error) => console.error(error),
      (reference) => toast.success("Payment successful!")
    );
  }
};
```

---

## 13. Fee Calculation

**File**: `utils/paystack/fees.ts`

Paystack charges fees, so to receive the exact amount, calculate what to charge the user.

```typescript
export interface PaystackFeeConfig {
  percentage: number; // 0.015 = 1.5%
  flatFee: number; // ₦100
  flatFeeThreshold: number; // ₦2,500
  cap: number; // ₦2,000 max
}

export const PAYSTACK_CONFIG: PaystackFeeConfig = {
  percentage: 0.015,
  flatFee: 100,
  flatFeeThreshold: 2500,
  cap: 2000,
};

/**
 * Calculate total to charge user so merchant receives `amount`.
 * Reverses the fee formula.
 */
export function calculatePaystackTotal(
  amount: number,
  config: PaystackFeeConfig = PAYSTACK_CONFIG
): number {
  if (amount <= 0) return 0;

  const { percentage, flatFee, flatFeeThreshold, cap } = config;

  // Check if cap applies
  const totalWithCap = amount + cap;
  const feeForCapScenario =
    totalWithCap * percentage +
    (totalWithCap >= flatFeeThreshold ? flatFee : 0);

  if (feeForCapScenario > cap) {
    return Math.ceil(totalWithCap * 100) / 100;
  }

  // Standard formula: T = (A + Flat) / (1 - P)
  let total = amount / (1 - percentage);
  if (total < flatFeeThreshold) {
    return Math.ceil(total * 100) / 100;
  }

  total = (amount + flatFee) / (1 - percentage);
  return Math.ceil(total * 100) / 100;
}
```

---

## 14. Best Practices

### Security

1. **Verify Webhooks**: Always verify Paystack signatures and 100Pay tokens
2. **Use HTTPS**: Ensure webhook URLs are HTTPS in production
3. **Environment Variables**: Never commit API keys to version control

### Idempotency

```typescript
// Always check before processing
const existing = await Transaction.findOne({
  providerReference: reference,
  status: "successful",
});
if (existing) return; // Already processed
```

### Error Handling

- Log all webhook events for debugging
- Create a `WebhookEvent` model to audit all incoming webhooks
- Handle network failures gracefully

### Database

- Use indexes on frequently queried fields
- Transaction status + wallet queries should be indexed
- Use `sparse: true` for optional unique fields

### Testing

- Use ngrok for local webhook testing
- Test both success and failure scenarios
- Verify idempotency by replaying webhooks

---

## Quick Reference

| Endpoint                  | Method | Purpose                        |
| ------------------------- | ------ | ------------------------------ |
| `/api/payment/initialize` | POST   | Start payment flow             |
| `/api/payment/status`     | GET    | Check transaction status       |
| `/api/transactions`       | GET    | Get user's transaction history |
| `/api/webhooks/paystack`  | POST   | Paystack webhook receiver      |
| `/api/webhooks/100pay`    | POST   | 100Pay webhook receiver        |
| `/callback`               | Page   | Handle Paystack redirect       |
