import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import AuthToken from "@/models/AuthToken";
import { createProvider } from "@untools/ai-toolkit";
import { createWalletService } from "@/services/walletService";
import { processDiff } from "@/utils/diff/processor";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  const requestId = nanoid();

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    await dbConnect();

    // Verify token
    const authToken = await AuthToken.findOne({
      token,
      expiresAt: { $gt: new Date() },
    }).populate({ path: "userId", model: User });

    if (!authToken) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Cast populated userId to User document
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user: any = authToken.userId;
    const walletService = createWalletService();

    // Check balance using wallet service + legacy credits
    const walletBalance = await walletService.getBalance(user._id.toString());
    const legacyCredits = user.credits || 0;
    const totalCredits = walletBalance + legacyCredits;

    if (totalCredits < 1) {
      return NextResponse.json(
        { error: "Insufficient credits", credits: totalCredits },
        { status: 403 }
      );
    }

    const { diff, model = "llama-3.1-8b-instant" } = await req.json();

    if (!diff) {
      return NextResponse.json({ error: "Diff is required" }, { status: 400 });
    }

    // Process diff if too large
    const processed = processDiff(diff);

    // Initialize AI Provider
    const provider = createProvider({
      provider: "vercel",
      vercelModel: { type: "groq", model: "llama-3.1-8b-instant" },
      apiKey: process.env.GROQ_API_KEY,
    });

    const systemPrompt = `You are an expert developer. Generate a commit message for the following git diff.
The message should follow the Conventional Commits specification.
Format: <type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>

Only return the commit message, nothing else.${
      processed.stats.isTruncated
        ? `\n\nNote: This diff was summarized from ${processed.stats.originalLength} chars to ${processed.stats.processedLength} chars. It affects ${processed.stats.totalFiles} files with +${processed.stats.additions}/-${processed.stats.deletions} changes.`
        : ""
    }`;

    const result = await provider.generateText({
      system: systemPrompt,
      messages: [{ role: "user", content: processed.content }],
    });

    if (!result.text) {
      throw new Error("Failed to generate text");
    }

    // Debit credit using wallet service
    await walletService.debit(user._id.toString(), {
      type: "commit_generation",
      creditsUsed: 1,
      metadata: {
        model,
        diffLength: diff.length,
        responseLength: result.text.length,
        requestId,
        userAgent: req.headers.get("user-agent") || undefined,
        ipAddress:
          req.headers.get("x-forwarded-for")?.split(",")[0] ||
          req.headers.get("x-real-ip") ||
          undefined,
        apiKeyUsed: token.substring(0, 8) + "...",
      },
    });

    // Get updated balance
    const creditsRemaining = await walletService.getBalance(
      user._id.toString()
    );

    return NextResponse.json({
      success: true,
      message: result.text,
      creditsRemaining,
      requestId,
    });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: "Internal server error", requestId },
      { status: 500 }
    );
  }
}
