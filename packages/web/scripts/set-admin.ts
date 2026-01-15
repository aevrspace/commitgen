import mongoose from "mongoose";
import User from "../models/User";
import dbConnect from "../lib/db";

const email = process.argv[2];

if (!email) {
  console.error("Please provide an email address");
  console.error("Usage: npx tsx scripts/set-admin.ts user@example.com");
  process.exit(1);
}

async function setAdmin() {
  try {
    await dbConnect();

    const user = await User.findOneAndUpdate(
      { email },
      {
        $set: { role: "admin" },
        $setOnInsert: { credits: 50, apiKeys: [] },
      },
      { new: true, upsert: true }
    );

    console.log(`Successfully promoted ${email} to admin`);
    process.exit(0);
  } catch (error) {
    console.error("Failed to set admin:", error);
    process.exit(1);
  }
}

setAdmin();
