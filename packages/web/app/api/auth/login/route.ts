import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Token from "@/models/Token";
import { EmailService } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await dbConnect();

    // Generate 6-digit code
    const code = crypto.randomInt(100000, 999999).toString();

    // Save token (expires in 15 minutes checking the schema default or we set it)
    // The schema has expiresAt required.
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await Token.create({
      email,
      code,
      expiresAt,
    });

    // Send email
    const emailService = new EmailService("resend"); // Use Resend as requested

    // Generate styled email template
    const htmlBody = emailService.generateMinimalistTemplate({
      title: "Your Login Code",
      content: `
        <p>Your login code for CommitGen is:</p>
        <div style="font-size: 32px; font-weight: bold; margin: 24px 0; letter-spacing: 4px; color: #333333;">${code}</div>
        <p>This code expires in 15 minutes.</p>
        <p style="color: #666666; font-size: 14px;">If you didn't request this code, you can safely ignore this email.</p>
      `,
      buttonText: "Go to Dashboard",
      buttonUrl: `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/dashboard`,
    });

    const result = await emailService.sendEmail({
      to: { email },
      subject: "Your Login Code - CommitGen",
      htmlBody,
      textBody: `Your login code for CommitGen is: ${code}`,
    });

    if (!result.success) {
      console.error("Failed to send email", result);
      return NextResponse.json(
        { error: "Failed to send verification email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification code sent",
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
