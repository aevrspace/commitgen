// ./src/providers/index.ts

import { VercelGoogleProvider } from "./vercel-google";
import { CommitGenProvider } from "./commitgen"; // NEW
import { ProviderConfig, AIProvider } from "../types";

export function createProvider(config: ProviderConfig): AIProvider {
  switch (config.provider) {
    case "vercel-google":
      return new VercelGoogleProvider(config.apiKey, config.model);
    case "commitgen":
      return new CommitGenProvider(config as any);
    default:
      throw new Error(`Unsupported provider: ${config.provider}`);
  }
}

export * from "./vercel-google";
export * from "./base";
