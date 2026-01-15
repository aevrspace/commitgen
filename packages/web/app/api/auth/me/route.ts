import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import dbConnect from "@/lib/db";
import AuthToken from "@/models/AuthToken";
import User from "@/models/User";
import { createWalletService } from "@/services/walletService";

export async function GET(req: NextRequest) {
  try {
    let token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get("authToken")?.value;
    }

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const authToken = await AuthToken.findOne({ token });

    if (!authToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Check expiry
    if (authToken.expiresAt < new Date()) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }

    const user = await User.findById(authToken.userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate balance from wallet transactions
    const walletService = createWalletService();
    const walletBalance = await walletService.getBalance(user._id.toString());

    // Include legacy credits as offset (for users with existing credits)
    // This ensures backward compatibility during migration
    const legacyCredits = user.credits || 0;
    const totalCredits = walletBalance + legacyCredits;

    return NextResponse.json({
      id: user._id,
      email: user.email,
      role: user.role,
      credits: totalCredits,
      walletBalance, // Expose for debugging/transparency
      legacyCredits, // Expose for debugging/transparency
    });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
