import { AIProvider } from "../types";
import {
  GitAnalysis,
  CommitMessage,
  CommitGenProviderConfig,
  GenerationResult,
  GenerateOptions,
} from "../types";

export class CommitGenProvider implements AIProvider {
  name = "commitgen";
  private token: string;
  private apiUrl: string;

  constructor(config: CommitGenProviderConfig) {
    this.token = config.apiKey || "";
    // Default to localhost for dev, but in prod this should be the deployed URL
    // We can infer this from env or config.
    // For now we'll assume the user is running the web app locally as per instructions
    this.apiUrl =
      process.env.COMMITGEN_API_URL || "https://commitgen.aevr.space";
  }

  async generateCommitMessage(
    analysis: GitAnalysis,
    options?: GenerateOptions,
  ): Promise<GenerationResult> {
    if (!this.token) {
      throw new Error("Authorization token is required for CommitGen provider");
    }

    try {
      const response = await fetch(`${this.apiUrl}/api/commit/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          diff: analysis.diff,
          hint: options?.hint,
        }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error(
            "Insufficient credits. Please recharge your account.",
          );
        }
        if (response.status === 401) {
          throw new Error("Invalid or expired token. Please login again.");
        }
        const errorData = (await response.json()) as any;
        throw new Error(errorData.error || `API Error: ${response.statusText}`);
      }

      const data = (await response.json()) as any;
      let message = data.message;

      // Clean up conversational prefixes
      message = message
        .replace(/^(Here is|Here's) (the|a) commit message.*:\s*/i, "")
        .replace(/^Sure, here is.*\n/i, "")
        .replace(/^Title:\s*/i, "")
        .replace(/^Commit Message:\s*/i, "")
        .trim();

      // Parse the message into CommitMessage format
      // Expected format from prompt: <type>(<scope>): <subject>\n\n<body>
      const firstLineMatch = message.match(/^(\w+)(?:\(([^)]+)\))?: (.+)$/m);

      if (!firstLineMatch) {
        // Fallback or simple parsing
        return {
          messages: [
            {
              type: "chore",
              subject: message.split("\n")[0],
              body: message.split("\n").slice(1).join("\n").trim(),
            },
          ],
        };
      }

      const type = firstLineMatch[1];
      const scope = firstLineMatch[2];
      const subject = firstLineMatch[3];
      const body = message.substring(firstLineMatch[0].length).trim();

      return {
        messages: [
          {
            type,
            scope,
            subject,
            body,
          },
        ],
        usage: {
          cost: data.creditsUsed || 0,
          remaining: data.creditsRemaining || 0,
          tier: data.usage?.tier,
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Unknown error occurred during commit generation");
    }
  }
}
