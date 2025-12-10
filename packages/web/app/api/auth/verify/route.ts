import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Token from "@/models/Token";
import User from "@/models/User";
import AuthToken from "@/models/AuthToken";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and code are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find valid token
    const tokenRecord = await Token.findOne({
      email,
      code,
      expiresAt: { $gt: new Date() },
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { error: "Invalid or expired verification code" },
        { status: 401 }
      );
    }

    // Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        email,
        credits: 50, // 50 free credits
      });
    }

    // Generate long-lived auth token (3 months)
    const tokenString = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 3);

    await AuthToken.create({
      token: tokenString,
      userId: user._id,
      expiresAt,
    });

    // Delete used verification token
    await Token.deleteOne({ _id: tokenRecord._id });

    return NextResponse.json({
      success: true,
      token: tokenString,
      user: {
        email: user.email,
        credits: user.credits,
      },
    });
  } catch (error) {
    console.error("Verify error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
