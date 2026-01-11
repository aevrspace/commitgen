import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import AuthToken from "@/models/AuthToken";
import { createProvider } from "@untools/ai-toolkit";
import { createWalletService } from "@/services/walletService";
import { processDiff } from "@/utils/diff/processor";
import { calculateCreditsForDiff } from "@/utils/credits/calculator";
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

    const { diff, model = "llama-3.1-8b-instant" } = await req.json();

    if (!diff) {
      return NextResponse.json({ error: "Diff is required" }, { status: 400 });
    }

    // Process diff if too large
    const processed = processDiff(diff);

    // Calculate credits based on processed diff size
    const {
      credits: creditsRequired,
      tokens,
      tier,
    } = calculateCreditsForDiff(processed.content);

    // Check balance using wallet service + legacy credits
    const walletBalance = await walletService.getBalance(user._id.toString());
    const legacyCredits = user.credits || 0;
    const totalCredits = walletBalance + legacyCredits;

    if (totalCredits < creditsRequired) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          credits: totalCredits,
          required: creditsRequired,
          tier: tier.name,
        },
        { status: 403 }
      );
    }

    // Initialize AI Provider
    const provider = createProvider({
      provider: "vercel",
      vercelModel: { type: "groq", model: "llama-3.1-8b-instant" },
      apiKey: process.env.GROQ_API_KEY,
    });

    const systemPrompt = `You are an expert developer. Generate a commit message for the provided git diff.
    
    Rules:
    1. Pattern: <type>(<scope>): <subject>
    2. Body:
       - Add a blank line after the subject.
       - Provide a bulleted list of changes (use hyphens).
       - Be specific and descriptive (e.g., "Add user authentication" instead of "Update code").
       - Mention specific files or components where relevant.
    
    Example:
    feat(auth): implement login drawer and validaton
    
    - Create LoginDrawer component with form validation
    - Add useAuth hook for managing session state
    - Update App.tsx to include the new drawer
    - Fix alignment issue in the header component
    
    Input Context:
    ${
      processed.stats.isTruncated
        ? `Note: This diff was summarized from ${processed.stats.originalLength} chars to ${processed.stats.processedLength} chars. It affects ${processed.stats.totalFiles} files with +${processed.stats.additions}/-${processed.stats.deletions} changes.`
        : ""
    }
    
    Response format:
    Return ONLY the commit message. Do not include markdown code blocks, quotes, or any other wrapper text.`;

    const result = await provider.generateText({
      system: systemPrompt,
      messages: [{ role: "user", content: processed.content }],
    });

    if (!result.text) {
      throw new Error("Failed to generate text");
    }

    // Debit credits based on volume (tier-based pricing)
    await walletService.debit(user._id.toString(), {
      type: "commit_generation",
      creditsUsed: creditsRequired,
      metadata: {
        model,
        diffLength: diff.length,
        processedDiffLength: processed.content.length,
        estimatedTokens: tokens,
        tier: tier.name,
        responseLength: result.text.length,
        requestId,
        userAgent: req.headers.get("user-agent") || undefined,
        ipAddress:
          req.headers.get("x-forwarded-for")?.split(",")[0] ||
          req.headers.get("x-real-ip") ||
          undefined,
        apiKeyUsed: token.substring(0, 8) + "...",
        wasTruncated: processed.stats.isTruncated,
        filesChanged: processed.stats.totalFiles,
      },
    });

    // Get updated balance
    const creditsRemaining =
      (await walletService.getBalance(user._id.toString())) +
      (user.credits || 0);

    return NextResponse.json({
      success: true,
      message: result.text,
      creditsUsed: creditsRequired,
      creditsRemaining,
      usage: {
        tier: tier.name,
        tokens,
        filesChanged: processed.stats.totalFiles,
        wasTruncated: processed.stats.isTruncated,
      },
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
