import { ConfigManager } from "../config";
import inquirer from "inquirer";
import chalk from "chalk";

// Default API URL (should match the one in provider/commitgen.ts)
const API_URL = process.env.COMMITGEN_API_URL || "http://localhost:3000";

export async function loginCommand(): Promise<void> {
  console.log(chalk.cyan("\n🔑 Login to CommitGen"));

  // 1. Ask for email
  const { email } = await inquirer.prompt([
    {
      type: "input",
      name: "email",
      message: "Enter your email address:",
      validate: (input) => {
        if (!input.includes("@")) return "Please enter a valid email address";
        return true;
      },
    },
  ]);

  try {
    // 2. Request code
    console.log(chalk.gray("\nSending verification code..."));
    const loginRes = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      body: JSON.stringify({ email }),
      headers: { "Content-Type": "application/json" },
    });

    if (!loginRes.ok) {
      const err = (await loginRes.json()) as any;
      throw new Error(err.error || "Failed to send verification code");
    }

    console.log(chalk.green("✅ Code sent! Check your email."));

    // 3. Ask for code
    const { code } = await inquirer.prompt([
      {
        type: "input",
        name: "code",
        message: "Enter the verification code:",
        validate: (input) => {
          if (input.length !== 6) return "Code must be 6 digits";
          return true;
        },
      },
    ]);

    // 4. Verify code
    console.log(chalk.gray("Verifying..."));
    const verifyRes = await fetch(`${API_URL}/api/auth/verify`, {
      method: "POST",
      body: JSON.stringify({ email, code }),
      headers: { "Content-Type": "application/json" },
    });

    if (!verifyRes.ok) {
      const err = (await verifyRes.json()) as any;
      throw new Error(err.error || "Verification failed");
    }

    const { token, user } = (await verifyRes.json()) as any;

    if (!token) {
      throw new Error("No token received");
    }

    // 5. Save token to config
    const configManager = new ConfigManager();
    const currentConfig = configManager.getProviderConfig();

    // Set provider to commitgen and save token
    configManager.setProvider({
      provider: "commitgen",
      apiKey: token, // We store the auth token in the apiKey field for simplicity based on our types
    });

    // We might also want to save the user info or credits locally, but types don't support it yet
    // and it's better to fetch fresh.

    console.log(chalk.green(`\n🎉 Successfully logged in as ${user.email}!`));
    console.log(chalk.blue(`💰 Credits available: ${user.credits}`));
    console.log(chalk.gray("CommitGen is now configured to use the AI API."));
  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red(`\n❌ Login failed: ${error.message}`));
    } else {
      console.error(chalk.red("\n❌ Login failed: Unknown error"));
    }
  }
}
