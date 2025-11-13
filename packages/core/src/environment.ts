import dotenv from 'dotenv';
import path from 'path';
import { BrowserType } from './adapters/interfaces';
import { AIConfig } from './engine/ai-engine';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

export interface EnvironmentConfig {
  defaultProvider: string;
  ollama: {
    baseUrl: string;
    model: string;
    temperature: number;
  };
  openai: {
    apiKey?: string;
    model: string;
    baseUrl: string;
    temperature: number;
    maxTokens: number;
  };

  // Browser Settings
  browser: {
    adapter: string;
    type: BrowserType;
    headless: boolean;
    viewport: {
      width: number;
      height: number;
    };
    timeout: number;
  };

  // Execution Settings
  execution: {
    logsDir: string;
  };

  // Debug Settings
  debug: {
    enabled: boolean;
    logLevel: string;
    screenshotOnError: boolean;
    screenshotsDir: string;
  };
}


export function loadEnvironmentConfig(): EnvironmentConfig {
  return {
    defaultProvider: process.env.DEFAULT_AI_PROVIDER || 'ollama',

    ollama: {
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      model: process.env.OLLAMA_MODEL || 'llama2',
      temperature: parseFloat(process.env.OLLAMA_TEMPERATURE || '0.3'),
    },

    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000'),
    },

    browser: {
      adapter: process.env.DEFAULT_ADAPTER || 'playwright',
      type: (process.env.DEFAULT_BROWSER as BrowserType) || BrowserType.CHROME,
      headless: process.env.BROWSER_HEADLESS === 'true',
      viewport: {
        width: parseInt(process.env.VIEWPORT_WIDTH || '1920'),
        height: parseInt(process.env.VIEWPORT_HEIGHT || '1080'),
      },
      timeout: parseInt(process.env.DEFAULT_TIMEOUT || '3000'),
    },

    execution: {
      logsDir: process.env.EXECUTION_LOGS_DIR || './execution-logs',
    },

    debug: {
      enabled: process.env.DEBUG === 'true',
      logLevel: process.env.LOG_LEVEL || 'info',
      screenshotOnError: process.env.SCREENSHOT_ON_ERROR === 'true',
      screenshotsDir: process.env.SCREENSHOTS_DIR || './screenshots',
    },
  };
}

export function createAIProviderConfigs(envConfig: EnvironmentConfig): Record<string, AIConfig> {
  const configs: Record<string, AIConfig> = {};

  configs.ollama = {
    model: envConfig.ollama.model,
    baseUrl: envConfig.ollama.baseUrl,
    temperature: envConfig.ollama.temperature,
  };

  if (envConfig.openai.apiKey) {
    configs.openai = {
      model: envConfig.openai.model,
      apiKey: envConfig.openai.apiKey,
      baseUrl: envConfig.openai.baseUrl,
      temperature: envConfig.openai.temperature,
      maxTokens: envConfig.openai.maxTokens,
    };
  }

  return configs;
}

export function isProviderAvailable(provider: string, envConfig: EnvironmentConfig): boolean {
  switch (provider.toLowerCase()) {
    case 'ollama':
      return true; // Always available (assuming Ollama is running)
    case 'openai':
      return !!envConfig.openai.apiKey;
    default:
      return false;
  }
}


export function getAvailableProviders(envConfig: EnvironmentConfig): string[] {
  const providers: string[] = [];

  providers.push('ollama');

  if (isProviderAvailable('openai', envConfig)) {
    providers.push('openai');
  }

  return providers;
}


export function validateDefaultProvider(envConfig: EnvironmentConfig): string {
  const requestedProvider = envConfig.defaultProvider;
  const availableProviders = getAvailableProviders(envConfig);

  if (availableProviders.includes(requestedProvider)) {
    return requestedProvider;
  }

  console.warn(`⚠️ Requested provider '${requestedProvider}' is not available. Available providers: ${availableProviders.join(', ')}`);
  return availableProviders[0] || 'ollama';
}

export const envConfig = loadEnvironmentConfig();
