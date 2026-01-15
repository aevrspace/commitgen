import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import PlatformSettings from "@/models/PlatformSettings";

/**
 * GET /api/settings
 *
 * Public endpoint to get current platform settings (pricing info).
 */
export async function GET() {
  try {
    await dbConnect();
    const settings = await PlatformSettings.getSettings();

    return NextResponse.json({
      creditsPerUsd: settings.creditsPerUsd,
      minPurchaseCredits: settings.minPurchaseCredits,
      freeCreditsOnSignup: settings.freeCreditsOnSignup,
      updatedAt: settings.updatedAt,
    });
  } catch (error) {
    console.error("Failed to get settings:", error);
    return NextResponse.json(
      { error: "Failed to get settings" },
      { status: 500 }
    );
  }
}

import { cookies } from "next/headers";
import AuthToken from "@/models/AuthToken";
import User from "@/models/User";

/**
 * PATCH /api/settings
 *
 * Admin-only endpoint to update platform settings.
 * Requires Authentication and Admin Role.
 */
export async function PATCH(request: NextRequest) {
  try {
    await dbConnect();

    // 1. Get Auth Token from Header or Cookie
    let token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get("authToken")?.value;
    }

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Validate Token
    const authToken = await AuthToken.findOne({
      token,
      expiresAt: { $gt: new Date() },
    });

    if (!authToken) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // 3. Check User Role
    const user = await User.findById(authToken.userId);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    const body = await request.json();
    const { creditsPerUsd, minPurchaseCredits, freeCreditsOnSignup } = body;

    // Validate inputs
    const updates: {
      creditsPerUsd?: number;
      minPurchaseCredits?: number;
      freeCreditsOnSignup?: number;
    } = {};

    if (creditsPerUsd !== undefined) {
      if (typeof creditsPerUsd !== "number" || creditsPerUsd <= 0) {
        return NextResponse.json(
          { error: "creditsPerUsd must be a positive number" },
          { status: 400 }
        );
      }
      updates.creditsPerUsd = creditsPerUsd;
    }

    if (minPurchaseCredits !== undefined) {
      if (typeof minPurchaseCredits !== "number" || minPurchaseCredits < 1) {
        return NextResponse.json(
          { error: "minPurchaseCredits must be at least 1" },
          { status: 400 }
        );
      }
      updates.minPurchaseCredits = minPurchaseCredits;
    }

    if (freeCreditsOnSignup !== undefined) {
      if (typeof freeCreditsOnSignup !== "number" || freeCreditsOnSignup < 0) {
        return NextResponse.json(
          { error: "freeCreditsOnSignup must be 0 or greater" },
          { status: 400 }
        );
      }
      updates.freeCreditsOnSignup = freeCreditsOnSignup;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid updates provided" },
        { status: 400 }
      );
    }

    const settings = await PlatformSettings.updateSettings(updates, user._id);

    return NextResponse.json({
      success: true,
      creditsPerUsd: settings.creditsPerUsd,
      minPurchaseCredits: settings.minPurchaseCredits,
      freeCreditsOnSignup: settings.freeCreditsOnSignup,
      updatedAt: settings.updatedAt,
    });
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
