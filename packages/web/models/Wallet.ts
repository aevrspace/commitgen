import { Schema, model, models, Model, Document, Types } from "mongoose";
import { Transaction } from "./Transaction";

/**
 * Wallet Model
 *
 * Represents a user's wallet for a specific currency/asset.
 * Balance is calculated dynamically from transactions.
 */

export interface IWallet extends Document {
  user: Types.ObjectId;
  symbol: string;
  createdAt: Date;
  updatedAt: Date;
}

// Extend the model interface to include static methods
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

// Unique constraint: one wallet per user per symbol
WalletSchema.index({ user: 1, symbol: 1 }, { unique: true });

/**
 * Get wallet balance by summing all successful transactions.
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
 * Get or create a wallet for a user and symbol.
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
