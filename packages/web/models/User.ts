import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  email: string;
  name?: string;
  role: "user" | "admin";
  credits: number;
  apiKeys: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    credits: { type: Number, default: 50 }, // Default free credits
    apiKeys: { type: [String], default: [] },
  },
  { timestamps: true }
);

// Check if model already exists to prevent overwrite error in hot reload
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
