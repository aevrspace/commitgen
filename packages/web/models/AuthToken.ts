import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAuthToken extends Document {
  token: string;
  userId: mongoose.Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
}

const AuthTokenSchema: Schema = new Schema({
  token: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  expiresAt: { type: Date, required: true, expires: 0 }, // TTL index
  createdAt: { type: Date, default: Date.now },
});

const AuthToken: Model<IAuthToken> =
  mongoose.models.AuthToken ||
  mongoose.model<IAuthToken>("AuthToken", AuthTokenSchema);

export default AuthToken;
