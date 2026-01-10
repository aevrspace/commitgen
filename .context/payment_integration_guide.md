# Payment Integration Guide: Paystack & 100Pay

This guide provides a comprehensive walkthrough for implementing Paystack and 100Pay payment gateways into a Next.js application. It covers environment setup, database schema, backend API routes, frontend integration, and webhook handling.

## 1. Prerequisites & Environment Setup

### Environment Variables

Ensure the following variables are set in your `.env` file:

```env
# Paystack
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...

# 100Pay
NEXT_PUBLIC_HUNDREDPAY_API_KEY=...
HUNDREDPAY_VERIFICATION_TOKEN=... # Custom token for verifying webhooks

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000 # or your production URL
```

### Dependencies

Install the required packages:

```bash
npm install nanoid @100pay-hq/checkout @react-input/number-format crypto
```

---

## 2. Database Schema

We use MongoDB with Mongoose. You need two primary models: `Wallet` and `WalletTransaction`, and an optional `WebhookEvent` for auditing.

### Wallet Model (`models/Wallet.ts`)

Stores user balances.

```typescript
import { Schema, model, models } from "mongoose";

const WalletSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  balance: { type: Number, default: 0 },
  currency: { type: String, default: "NGN" },
  type: { type: String, default: "personal" },
});

export const Wallet = models.Wallet || model("Wallet", WalletSchema);
```

### WalletTransaction Model (`models/WalletTransaction.ts`)

Tracks every payment attempts and completion.

```typescript
import { Schema, model, models } from "mongoose";

const WalletTransactionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: {
    type: String,
    enum: ["deposit", "transfer", "withdrawal"],
    required: true,
  },
  amount: { type: Number, required: true },
  fee: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["pending", "processing", "confirmed", "failed"],
    default: "pending",
  },
  providerReference: { type: String, unique: true, required: true },
  metadata: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
});

export const WalletTransaction =
  models.WalletTransaction ||
  model("WalletTransaction", WalletTransactionSchema);
```

---

## 3. Paystack Implementation

### Utility Functions (`lib/paystack.ts`)

```typescript
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

export async function initializePayment(
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
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/wallet`,
      }),
    }
  );
  return await response.json();
}

export async function verifyPayment(reference: string) {
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

### Initialization Endpoint (`app/api/payment/initialize/route.ts`)

```typescript
import { NextResponse } from "next/server";
import crypto from "crypto";
import { WalletTransaction } from "@/models/WalletTransaction";
import { initializePayment } from "@/lib/paystack";

export async function POST(request: Request) {
  const { amount, email, userId } = await request.json();
  const reference = crypto.randomBytes(16).toString("hex");

  // 1. Create Pending Transaction
  await WalletTransaction.create({
    userId,
    type: "deposit",
    amount,
    status: "pending",
    providerReference: reference,
    metadata: { provider: "paystack" },
  });

  // 2. Initialize with Paystack
  const data = await initializePayment(email, amount, reference);

  if (!data.status) {
    return NextResponse.json(
      { error: "Initialization failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ authorizationUrl: data.data.authorization_url });
}
```

### Webhook Endpoint (`app/api/webhooks/paystack/route.ts`)

```typescript
import { NextResponse } from "next/server";
import crypto from "crypto";
import { WalletTransaction } from "@/models/WalletTransaction";
import { Wallet } from "@/models/Wallet";
import { verifyPayment } from "@/lib/paystack";

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
    const verification = await verifyPayment(reference);
    if (verification.data.status !== "success")
      return NextResponse.json({ error: "Verification failed" });

    // 4. Update Transaction & Wallet
    const transaction = await WalletTransaction.findOne({
      providerReference: reference,
    });
    if (transaction) {
      transaction.status = "confirmed";
      transaction.amount = verification.data.amount / 100; // Store Net amount
      await transaction.save();

      await Wallet.findOneAndUpdate(
        { userId: transaction.userId },
        { $inc: { balance: transaction.amount } },
        { upsert: true } // Create wallet if not exists
      );
    }
  }

  return NextResponse.json({ received: true });
}
```

---

## 4. 100Pay Implementation

### Frontend Utility (`utils/payWith100Pay.ts`)

```typescript
import { shop100Pay } from "@100pay-hq/checkout";
import { nanoid } from "nanoid";

export const payWith100Pay = async (
  data: any,
  onClose: any,
  onError: any,
  onCallback: any
) => {
  shop100Pay.setup({
    ref_id: nanoid(),
    api_key: data.apiKey,
    billing: {
      amount: data.billing.amount,
      currency: "NGN", // or USD, etc
      description: "Wallet Deposit",
      country: "NG",
    },
    customer: {
      email: data.customer.email,
      name: data.customer.name,
      user_id: data.customer.user_id,
      phone: data.customer.phone,
    },
    metadata: data.metadata,
    onClose,
    onError, // (error) => ...
    callback: onCallback, // (reference) => ...
  });
};
```

### Initialization Endpoint (`app/api/wallet/deposit/100pay/route.ts`)

100Pay integration often starts with creating a reference on your backend before calling the SDK.

```typescript
import { NextResponse } from "next/server";
import { WalletTransaction } from "@/models/WalletTransaction";
import { nanoid } from "nanoid";

export async function POST(request: Request) {
  const { amount, userId } = await request.json();
  const reference = nanoid();

  await WalletTransaction.create({
    userId,
    type: "deposit",
    amount,
    status: "pending",
    providerReference: reference,
    metadata: { provider: "100pay" },
  });

  return NextResponse.json({
    success: true,
    data: { ref_id: reference, amount },
  });
}
```

### Webhook Endpoint (`app/api/webhooks/100pay/route.ts`)

```typescript
import { NextResponse } from "next/server";
import { WalletTransaction } from "@/models/WalletTransaction";
import { Wallet } from "@/models/Wallet";

export async function POST(request: Request) {
  const verificationToken = request.headers.get("verification-token");

  // 1. Verify Token
  if (verificationToken !== process.env.HUNDREDPAY_VERIFICATION_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const event = await request.json();

  if (event.type === "credit") {
    const reference = event.data.charge.metadata.ref_id;
    const amount = parseFloat(event.data.charge.billing.amount);

    // 2. Update Transaction
    const transaction = await WalletTransaction.findOne({
      providerReference: reference,
    });
    if (transaction && transaction.status !== "confirmed") {
      transaction.status = "confirmed";
      transaction.amount = amount;
      await transaction.save();

      // 3. Update Wallet
      await Wallet.findOneAndUpdate(
        { userId: transaction.userId },
        { $inc: { balance: amount } },
        { upsert: true }
      );
    }
  }

  return NextResponse.json({ received: true });
}
```

---

## 5. Frontend Integration Example (`DepositPage.tsx`)

A React component to handle both options.

```tsx
import { useState } from "react";
import { payWith100Pay } from "@/utils/payWith100Pay";

export default function DepositPage() {
  const [provider, setProvider] = useState("paystack");
  const [amount, setAmount] = useState(1000);

  const handleDeposit = async () => {
    if (provider === "paystack") {
      // Call backend to get authorization URL
      const res = await fetch("/api/payment/initialize", {
        method: "POST",
        body: JSON.stringify({ amount, email: "user@example.com" }),
      });
      const data = await res.json();
      if (data.authorizationUrl) window.location.href = data.authorizationUrl;
    } else {
      // 1. Create reference on backend
      const res = await fetch("/api/wallet/deposit/100pay", {
        method: "POST",
        body: JSON.stringify({ amount }),
      });
      const { data } = await res.json();

      // 2. Launch 100Pay Modal
      payWith100Pay(
        {
          apiKey: process.env.NEXT_PUBLIC_HUNDREDPAY_API_KEY,
          billing: { amount: data.amount },
          customer: {
            email: "user@example.com",
            name: "User",
            user_id: "123",
            phone: "000",
          },
          metadata: { ref_id: data.ref_id },
        },
        () => console.log("Closed"),
        (err) => console.error(err),
        (ref) => console.log("Success", ref)
      );
    }
  };

  return (
    <div>
      <select onChange={(e) => setProvider(e.target.value)}>
        <option value="paystack">Paystack</option>
        <option value="100pay">100Pay</option>
      </select>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
      />
      <button onClick={handleDeposit}>Deposit</button>
    </div>
  );
}
```

## 6. Critical Considerations

1.  **Idempotency:** Always check if a transaction `providerReference` has already been processed in your webhooks to prevent double-crediting wallets.
2.  **Concurrency:** Use database transactions or optimistic locking (e.g., `findByIdAndUpdate`) when updating wallet balances to avoid race conditions.
3.  **Security:** Always verify webhook signatures (Paystack) or tokens (100Pay) to ensure requests are legitimate.
4.  **Logging:** Implement structured logging for payment events to trace failures easily.

This guide provides the core building blocks. You may need to adapt the user authentication and specific business logic (fees, limits) to your new application.
