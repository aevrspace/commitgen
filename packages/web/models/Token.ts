import mongoose, { Schema, Document, Model } from "mongoose";

export interface IToken extends Document {
  email: string;
  code: string;
  expiresAt: Date;
  createdAt: Date;
}

const TokenSchema: Schema = new Schema({
  email: { type: String, required: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true, expires: 0 }, // TTL index
  createdAt: { type: Date, default: Date.now },
});

const Token: Model<IToken> =
  mongoose.models.Token || mongoose.model<IToken>("Token", TokenSchema);

export default Token;
