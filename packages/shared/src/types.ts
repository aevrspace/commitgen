// Shared types that can be used across CLI and Web packages

export interface CommitMessage {
  type: string;
  scope?: string;
  subject: string;
  body?: string;
  footer?: string;
}

export interface GitAnalysis {
  filesChanged: number;
  additions: number;
  deletions: number;
  changedFiles: string[];
}

export interface CommitGenConfig {
  provider: {
    provider: string;
    model: string;
    apiKey?: string;
  };
  features: {
    historyLearning: boolean;
    multiCommit: boolean;
    issueTracking: boolean;
  };
}
