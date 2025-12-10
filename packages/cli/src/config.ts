// ./src/config.ts

import fs from "fs";
import path from "path";
import os from "os";
import { ProviderConfig } from "./types";

interface CommitGenConfig {
  provider?: ProviderConfig;
  defaultProvider?:
    | "vercel-google"
    | "vercel-openai"
    | "groq"
    | "openai"
    | "google"
    | "local";
}

export class ConfigManager {
  private configPath: string;
  private config: CommitGenConfig;

  constructor() {
    this.configPath = path.join(os.homedir(), ".commitgenrc.json");
    this.config = this.loadConfig();
  }

  private loadConfig(): CommitGenConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const content = fs.readFileSync(this.configPath, "utf8");
        return JSON.parse(content);
      }
    } catch (error) {
      console.warn("Failed to load config file:", error);
    }
    return {};
  }

  saveConfig(config: CommitGenConfig): void {
    try {
      fs.writeFileSync(
        this.configPath,
        JSON.stringify(config, null, 2),
        "utf8",
      );
      this.config = config;
    } catch (error) {
      console.error("Failed to save config:", error);
    }
  }

  getProviderConfig(): ProviderConfig {
    if (this.config.provider) {
      return this.config.provider;
    }

    // Default to vercel-google
    return {
      provider: this.config.defaultProvider || "vercel-google",
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      model: "gemini-2.5-flash",
    };
  }

  setProvider(config: ProviderConfig): void {
    this.saveConfig({
      ...this.config,
      provider: config,
    });
  }
}
