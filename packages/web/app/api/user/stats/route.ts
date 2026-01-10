import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import dbConnect from "@/lib/db";
import AuthToken from "@/models/AuthToken";
import User from "@/models/User";
import { Transaction } from "@/models/Transaction";
import { CreditUsage } from "@/models/CreditUsage";
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

    if (!authToken || authToken.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const userId = authToken.userId.toString();
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get wallet balance
    const walletService = createWalletService();
    const walletBalance = await walletService.getBalance(userId);
    const legacyCredits = user.credits || 0;
    const totalCredits = walletBalance + legacyCredits;

    // Get transaction stats
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Aggregations
    const [
      totalCreditsAdded,
      totalCreditsUsed,
      last7DaysUsage,
      last30DaysUsage,
      recentUsage,
      recentTransactions,
      usageByDay,
    ] = await Promise.all([
      // Total credits added (successful credits)
      Transaction.aggregate([
        {
          $match: {
            user: authToken.userId,
            status: "successful",
            type: "credit",
            symbol: "CREDITS",
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      // Total credits used (debits)
      Transaction.aggregate([
        {
          $match: {
            user: authToken.userId,
            status: "successful",
            type: "debit",
            symbol: "CREDITS",
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      // Last 7 days usage count
      CreditUsage.countDocuments({
        userId: authToken.userId,
        createdAt: { $gte: sevenDaysAgo },
      }),
      // Last 30 days usage count
      CreditUsage.countDocuments({
        userId: authToken.userId,
        createdAt: { $gte: thirtyDaysAgo },
      }),
      // Recent usage entries (last 10)
      CreditUsage.find({ userId: authToken.userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      // Recent transactions (last 10)
      Transaction.find({ user: authToken.userId, status: "successful" })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      // Usage by day (last 7 days) for chart
      CreditUsage.aggregate([
        {
          $match: {
            userId: authToken.userId,
            createdAt: { $gte: sevenDaysAgo },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
            credits: { $sum: "$creditsUsed" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Calculate commits generated
    const commitsGenerated = await CreditUsage.countDocuments({
      userId: authToken.userId,
      type: "commit_generation",
    });

    return NextResponse.json({
      balance: {
        total: totalCredits,
        wallet: walletBalance,
        legacy: legacyCredits,
      },
      stats: {
        totalCreditsAdded: totalCreditsAdded[0]?.total || 0,
        totalCreditsUsed: totalCreditsUsed[0]?.total || 0,
        commitsGenerated,
        last7DaysUsage,
        last30DaysUsage,
      },
      charts: {
        usageByDay,
      },
      recent: {
        usage: recentUsage,
        transactions: recentTransactions,
      },
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
