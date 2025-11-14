import type { ObservabilityConfig } from '../observability';

/**
 * Unified configuration type definitions for TheAgent
 */

export interface TheAgentConfig {
  // Browser Configuration
  browser: {
    adapter: 'playwright' | 'puppeteer' | 'selenium' | 'auto';
    type: 'chrome' | 'firefox' | 'safari' | 'edge' | 'chromium';
    headless: boolean;
    viewport?: { width: number; height: number };
    timeout: number;
    retries: number;
    slowMo?: number;
  };

  // LLM Configuration with multiple profiles
  llm: {
    // Active LLM profile name
    active: string;

    // Available LLM profiles
    profiles: {
      [profileName: string]: {
        provider: 'openai' | 'anthropic' | 'ollama' | 'mistral';
        model: string;
        apiKey?: string;
        baseUrl?: string;
        temperature?: number;
        maxTokens?: number;
        description?: string;
        observability?: ObservabilityConfig;
      };
    };
  };

  // Execution Configuration
  execution: {
    logsDir: string;
    screenshotsDir: string;
    screenshotOnError?: boolean;
  };
}

// Legacy types for backward compatibility during transition
export type AIConfig = TheAgentConfig['llm']['profiles'][string];
export type LLMConfig = TheAgentConfig['llm'];
export type LLMProfile = TheAgentConfig['llm']['profiles'][string];

export type ExecutionOptions = {
  timeout?: number;
  retries?: number;
  screenshot?: boolean;
  headless?: boolean;
  slowMo?: number;
};
