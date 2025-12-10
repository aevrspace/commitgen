// ./src/providers/index.ts

import { VercelGoogleProvider } from "./vercel-google";
import { ProviderConfig, AIProvider } from "../types";

export function createProvider(config: ProviderConfig): AIProvider {
  switch (config.provider) {
    case "vercel-google":
      return new VercelGoogleProvider(config.apiKey, config.model);

    // Future providers
    // case 'vercel-openai':
    //   return new VercelOpenAIProvider(config.apiKey, config.model);
    // case 'groq':
    //   return new GroqProvider(config.apiKey, config.model);
    // case 'openai':
    //   return new OpenAIProvider(config.apiKey, config.model);
    // case 'google':
    //   return new GoogleProvider(config.apiKey, config.model);
    // case 'local':
    //   return new LocalProvider(config.baseUrl, config.model);

    default:
      throw new Error(`Unsupported provider: ${config.provider}`);
  }
}

export * from "./vercel-google";
export * from "./base";
