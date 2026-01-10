export const CREDITS_PER_USD = 80;
export const USD_TO_NGN_RATE = 1500; // Fixed rate for MVP, or we can fetch dynamic if needed.

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

export async function initializePaystackPayment(
  email: string,
  amount: number, // in NGN
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
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/credits`,
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
