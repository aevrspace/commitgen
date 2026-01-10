import chalk from "chalk";
import { ConfigManager } from "../config";
import { exec } from "child_process";
import { platform } from "os";

const WEB_APP_URL =
  process.env.COMMITGEN_WEB_URL || "https://commitgen.aevr.space";

/**
 * Opens a URL in the default browser
 */
function openBrowser(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    let command: string;

    switch (platform()) {
      case "darwin":
        command = `open "${url}"`;
        break;
      case "win32":
        command = `start "" "${url}"`;
        break;
      default:
        // Linux and others
        command = `xdg-open "${url}"`;
        break;
    }

    exec(command, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

export async function dashboardCommand(): Promise<void> {
  const configManager = new ConfigManager();
  const providerConfig = configManager.getProviderConfig();
  const token = providerConfig.apiKey;

  console.log(chalk.cyan("\n📊 Opening CommitGen Dashboard\n"));

  if (!token) {
    console.log(
      chalk.yellow("⚠️  You are not logged in. Opening dashboard without auth.")
    );
    console.log(
      chalk.blue("💡 Run 'commitgen login' to log in and sync your account.\n")
    );
  }

  // Build the dashboard URL with auth token if available
  const dashboardUrl = token
    ? `${WEB_APP_URL}/dashboard?cli_token=${encodeURIComponent(token)}`
    : `${WEB_APP_URL}/dashboard`;

  try {
    console.log(chalk.gray("Opening browser...\n"));
    await openBrowser(dashboardUrl);
    console.log(chalk.green("✅ Dashboard opened in your browser!"));
    console.log(chalk.gray(`   ${WEB_APP_URL}/dashboard\n`));

    if (token) {
      console.log(
        chalk.blue("ℹ  You're signed in automatically via CLI token.")
      );
    }
  } catch (error) {
    console.error(chalk.red("❌ Failed to open browser."));
    console.log(chalk.gray("\nPlease open this URL manually:"));
    console.log(chalk.underline.blue(dashboardUrl));
  }
}
