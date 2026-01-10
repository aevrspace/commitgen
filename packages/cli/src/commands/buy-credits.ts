import inquirer from "inquirer";
import chalk from "chalk";
import { ConfigManager } from "../config";

export async function buyCreditsCommand() {
  const configManager = new ConfigManager();
  const providerConfig = configManager.getProviderConfig();

  const token = providerConfig.apiKey;

  console.log(chalk.cyan("\n💎 Buy CommitGen Credits\n"));

  const { amount } = await inquirer.prompt([
    {
      type: "list",
      name: "amount",
      message: "Select credit pack:",
      choices: [
        { name: "Standard Pack (80 Credits) - $1.00", value: 80 },
        { name: "Pro Pack (450 Credits) - $5.00", value: 450 },
        { name: "Mega Pack (1000 Credits) - $10.00", value: 1000 },
      ],
    },
  ]);

  const { provider } = await inquirer.prompt([
    {
      type: "list",
      name: "provider",
      message: "Select payment provider:",
      choices: [
        { name: "Paystack", value: "paystack" },
        { name: "100Pay", value: "100pay" },
      ],
    },
  ]);

  console.log(chalk.yellow("\nInitializing payment..."));

  const WEB_APP_URL = process.env.COMMITGEN_WEB_URL || "http://localhost:3000";

  try {
    const response = await fetch(`${WEB_APP_URL}/api/payment/initialize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        amountOfCredits: amount,
        provider,
      }),
    });

    const data: any = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to initialize payment");
    }

    console.log(chalk.green("✔ Payment initialized!"));

    let url = "";
    if (provider === "paystack") {
      url = data.authorizationUrl;
    } else {
      url = `${WEB_APP_URL}/credits`;
      console.log(
        chalk.blue("ℹ For 100Pay, please complete the payment on our website.")
      );
    }

    if (url) {
      console.log(
        chalk.white(`\n👉 Please open this URL to complete payment:\n`)
      );
      console.log(chalk.underline.blue(url));
      console.log("\n");

      if (data.reference) {
        console.log(chalk.yellow("⏳ Waiting for payment confirmation..."));

        const pollInterval = setInterval(async () => {
          try {
            const statusRes = await fetch(
              `${WEB_APP_URL}/api/payment/status?reference=${data.reference}`
            );
            if (statusRes.ok) {
              const statusData: any = await statusRes.json();
              if (statusData.status === "confirmed") {
                clearInterval(pollInterval);
                console.log(
                  chalk.green(
                    "\n🎉 Payment confirmed! You can now generate commits."
                  )
                );
                process.exit(0);
              }
            }
          } catch (e) {
            // ignore errors during poll
          }
        }, 3000);

        // Timeout after 5 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
          console.log(
            chalk.red(
              "\n❌ Polling timed out. Please check your dashboard for status."
            )
          );
          process.exit(1);
        }, 300000);
      }
    }
  } catch (error: any) {
    console.error(chalk.red(`❌ Error: ${error.message}`));
    if (
      error.message.includes("unauthorized") ||
      error.message.includes("Missing required fields")
    ) {
      console.log(
        chalk.yellow(
          "💡 Please make sure you are logged in. Run 'commitgen login'"
        )
      );
    }
  }
}
