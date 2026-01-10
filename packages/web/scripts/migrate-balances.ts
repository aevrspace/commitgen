/**
 * Migration Script: Migrate User Balances to Transaction System
 *
 * This script migrates existing User.credits to the new transaction-based wallet system
 * by creating bonus credit transactions for each user.
 *
 * Run with: npx tsx scripts/migrate-balances.ts
 *
 * Make sure MONGODB_URI is set in your environment or .env file
 */

import mongoose from "mongoose";
import fs from "fs";
import path from "path";

// Load environment variables from .env file
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        const value = valueParts.join("=").replace(/^["']|["']$/g, "");
        if (key && !process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

loadEnv();

async function migrateBalances() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error("MONGODB_URI not found in environment");
    process.exit(1);
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB");

  // Import models after connection
  const User = (await import("../models/User")).default;
  const { Wallet } = await import("../models/Wallet");
  const { Transaction } = await import("../models/Transaction");

  try {
    // Find all users with credits > 0
    const usersWithCredits = await User.find({ credits: { $gt: 0 } });
    console.log(`Found ${usersWithCredits.length} users with existing credits`);

    let migrated = 0;
    let skipped = 0;

    for (const user of usersWithCredits) {
      // Check if already migrated (has a bonus transaction)
      const existingMigration = await Transaction.findOne({
        user: user._id,
        category: "bonus",
        "metadata.migrationType": "legacy_balance",
      });

      if (existingMigration) {
        console.log(`Skipping user ${user.email} - already migrated`);
        skipped++;
        continue;
      }

      // Get or create CREDITS wallet
      const wallet = await Wallet.getOrCreate(user._id, "CREDITS");

      // Create bonus credit transaction
      await Transaction.create({
        user: user._id,
        wallet: wallet._id,
        type: "credit",
        status: "successful",
        symbol: "CREDITS",
        category: "bonus",
        channel: "system",
        amount: user.credits,
        fee: 0,
        providerReference: `migration-${user._id.toString()}-${Date.now()}`,
        metadata: {
          migrationType: "legacy_balance",
          originalCredits: user.credits,
          migratedAt: new Date().toISOString(),
        },
      });

      console.log(`Migrated ${user.credits} credits for user ${user.email}`);
      migrated++;
    }

    console.log("\n--- Migration Complete ---");
    console.log(`Migrated: ${migrated}`);
    console.log(`Skipped (already migrated): ${skipped}`);
    console.log(`Total users processed: ${usersWithCredits.length}`);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

migrateBalances();
