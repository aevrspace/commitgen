import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import PlatformSettings from "@/models/PlatformSettings";

/**
 * GET /api/credits/packages
 *
 * Public endpoint to get credit packages.
 * Packages are dynamically calculated based on the current PlatformSettings.creditsPerUsd rate.
 */
export async function GET() {
  try {
    await dbConnect();
    const settings = await PlatformSettings.getSettings();
    const rate = settings.creditsPerUsd || 80; // Default fallback

    const tiers = [
      { name: "Standard Pack", price: 1.0 },
      { name: "Pro Pack", price: 5.0 },
      { name: "Mega Pack", price: 10.0 },
    ];

    const packages = tiers.map((tier) => {
      const credits = Math.floor(tier.price * rate);
      return {
        name: tier.name,
        credits: credits,
        price: tier.price,
        currency: "USD",
        label: `${tier.name} (${credits} Credits) - $${tier.price.toFixed(2)}`,
        value: credits,
      };
    });

    return NextResponse.json(packages);
  } catch (error) {
    console.error("Failed to fetch credit packages:", error);
    // Fallback if DB fails
    const fallbackRate = 80;
    const tiers = [
      { name: "Standard Pack", price: 1.0 },
      { name: "Pro Pack", price: 5.0 },
      { name: "Mega Pack", price: 10.0 },
    ];
    const packages = tiers.map((tier) => {
      const credits = Math.floor(tier.price * fallbackRate);
      return {
        name: tier.name,
        credits: credits,
        price: tier.price,
        currency: "USD",
        label: `${tier.name} (${credits} Credits) - $${tier.price.toFixed(2)}`,
        value: credits,
      };
    });
    return NextResponse.json(packages);
  }
}
