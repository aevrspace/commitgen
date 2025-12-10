import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import AuthToken from "@/models/AuthToken";
import { createProvider } from "@untools/ai-toolkit";

export async function POST(req: NextRequest) {
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
    }).populate("userId");

    if (!authToken) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Cast populated userId to User document
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user: any = authToken.userId;

    if (user.credits <= 0) {
      return NextResponse.json(
        { error: "Insufficient credits" },
        { status: 403 }
      );
    }

    const { diff, model = "gpt-3.5-turbo" } = await req.json();

    if (!diff) {
      return NextResponse.json({ error: "Diff is required" }, { status: 400 });
    }

    // Initialize AI Provider
    // For now we default to OpenAI or whatever is configured in env
    // In a real scenario, we might let the user choose or have a system default via Vercel AI SDK
    const provider = createProvider({
      provider: "vercel",
      vercelModel: { type: "groq", model: "llama-3.1-8b-instant" }, // cost-effective default
      apiKey: process.env.GROQ_API_KEY, // Needs to be in .env
    });

    const systemPrompt = `You are an expert developer. Generate a commit message for the following git diff.
The message should follow the Conventional Commits specification.
Format: <type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>

Only return the commit message, nothing else.`;

    const result = await provider.generateText({
      system: systemPrompt,
      messages: [{ role: "user", content: diff }],
    });

    if (!result.text) {
      throw new Error("Failed to generate text");
    }

    // Deduct credit
    user.credits -= 1;
    await user.save();

    return NextResponse.json({
      success: true,
      message: result.text,
      creditsRemaining: user.credits,
    });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
