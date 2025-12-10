// ./src/commands/configure.ts

import inquirer from "inquirer";
import chalk from "chalk";
import { ConfigManager } from "../config";
import { ProviderConfig } from "../types";

export async function configureCommand(): Promise<void> {
  console.log(chalk.cyan.bold("\n⚙️  Configure CommitGen\n"));

  const configManager = new ConfigManager();
  const currentConfig = configManager.getProviderConfig();

  // Show current configuration if it exists
  if (currentConfig.provider) {
    console.log(chalk.gray("Current configuration:"));
    console.log(chalk.gray(`  Provider: ${currentConfig.provider}`));
    console.log(chalk.gray(`  Model: ${currentConfig.model || "default"}`));
    console.log(
      chalk.gray(
        `  API Key: ${currentConfig.apiKey ? "***configured***" : "not set"}`
      )
    );
    console.log();
  }

  const { provider } = await inquirer.prompt([
    {
      type: "list",
      name: "provider",
      message: "Select AI provider:",
      choices: [
        { name: "Vercel AI SDK - Google Gemini", value: "vercel-google" },
        {
          name: "Vercel AI SDK - OpenAI (Coming Soon)",
          value: "vercel-openai",
          disabled: true,
        },
        { name: "Groq (Coming Soon)", value: "groq", disabled: true },
        {
          name: "OpenAI Direct (Coming Soon)",
          value: "openai",
          disabled: true,
        },
        {
          name: "Google Direct (Coming Soon)",
          value: "google",
          disabled: true,
        },
        { name: "Local LLM (Coming Soon)", value: "local", disabled: true },
      ],
      default: currentConfig.provider || "vercel-google",
    },
  ]);

  let config: ProviderConfig = { provider };

  // Provider-specific configuration
  if (provider === "vercel-google") {
    const hasEnvKey = !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    const { apiKey, model } = await inquirer.prompt([
      {
        type: "password",
        name: "apiKey",
        message: hasEnvKey
          ? "Enter your Google AI API key (or press Enter to use GOOGLE_GENERATIVE_AI_API_KEY env var):"
          : "Enter your Google AI API key (get one at https://aistudio.google.com/app/apikey):",
        mask: "*",
        validate: (input: string) => {
          if (!input.trim() && !hasEnvKey) {
            return "API key is required. Get one at https://aistudio.google.com/app/apikey";
          }
          return true;
        },
        default:
          currentConfig.provider === provider
            ? currentConfig.apiKey
            : undefined,
      },
      {
        type: "list",
        name: "model",
        message: "Select model:",
        choices: [
          {
            name: "Gemini 2.5 Flash (Fast, Recommended)",
            value: "gemini-2.5-flash",
          },
          { name: "Gemini 2.5 Pro (More Capable)", value: "gemini-2.5-pro" },
          { name: "Gemini 1.5 Flash", value: "gemini-1.5-flash" },
          { name: "Gemini 1.5 Pro", value: "gemini-1.5-pro" },
        ],
        default: currentConfig.model || "gemini-2.5-flash",
      },
    ]);

    config.apiKey = apiKey || undefined;
    config.model = model;
  }

  configManager.setProvider(config);

  console.log(chalk.green("\n✅ Configuration saved successfully!"));
  console.log(
    chalk.gray(`Config file: ${require("os").homedir()}/.commitgenrc.json`)
  );
}
