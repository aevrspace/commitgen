import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import dbConnect from "@/lib/db";
import AuthToken from "@/models/AuthToken";
import { CreditUsage } from "@/models/CreditUsage";

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

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const [usage, total] = await Promise.all([
      CreditUsage.find({ userId: authToken.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CreditUsage.countDocuments({ userId: authToken.userId }),
    ]);

    return NextResponse.json({
      usage,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Commits usage error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
