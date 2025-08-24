/**
 * AI and configuration type definitions
 */

export type AIConfig = {
  provider: string;
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
};

export type ExecutionOptions = {
  timeout?: number;
  retries?: number;
  screenshot?: boolean;
  headless?: boolean;
  slowMo?: number;
};
