// ./src/types.ts

export interface CommitMessage {
  type: string;
  scope?: string;
  subject: string;
  body?: string;
  breaking?: boolean;
}

export interface ProviderConfig {
  provider:
    | "vercel-google"
    | "vercel-openai"
    | "groq"
    | "openai"
    | "google"
    | "local"
    | "commitgen";
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

export interface CommitGenProviderConfig {
  provider: "commitgen";
  apiKey?: string; // This is actually the auth token
  model?: string;
}

// New interfaces for enhanced features
export interface CommitGenOptions {
  push?: boolean;
  noverify?: boolean;
  useAi?: boolean;
  multiCommit?: boolean;
  learnFromHistory?: boolean;
  linkIssues?: boolean;
  model?: string; // NEW: Model override option
  login?: boolean; // NEW: Login flag
  config?: boolean; // NEW: Config flag
}

export interface EnhancedConfig {
  provider: ProviderConfig;
  features: {
    historyLearning: boolean;
    multiCommit: boolean;
    issueTracking: boolean;
  };
}

export interface GitAnalysis {
  filesChanged: string[];
  additions: number;
  deletions: number;
  hasStaged: boolean;
  hasUnstaged: boolean;
  diff: string;
}

export interface GenerationUsage {
  cost: number;
  remaining: number;
  tier?: string;
}

export interface GenerationResult {
  messages: CommitMessage[];
  usage?: GenerationUsage;
}

export interface GenerateOptions {
  hint?: string;
}

export interface AIProvider {
  name: string;
  generateCommitMessage(
    analysis: GitAnalysis,
    options?: GenerateOptions,
  ): Promise<GenerationResult>;
}
