import { shop100Pay } from "@100pay-hq/checkout";
import { nanoid } from "nanoid";

interface PayWith100PayData {
  apiKey: string;
  billing: {
    amount: number;
    currency?: string;
  };
  customer: {
    email: string;
    name: string;
    user_id: string;
    phone?: string;
  };
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
      currency: "NGN", // or USD
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
