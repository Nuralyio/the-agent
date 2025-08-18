import dotenv from 'dotenv';
import path from 'path';
import { AIConfig } from './engine/ai-engine';
import { BrowserType } from './types';

// Load environment variables from .env file in the project root
dotenv.config({ path: path.join(__dirname, '../../../.env') });

export interface EnvironmentConfig {
  // AI Provider Settings
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

  // Debug Settings
  debug: {
    enabled: boolean;
    logLevel: string;
    screenshotOnError: boolean;
    screenshotsDir: string;
  };
}

/**
 * Load configuration from environment variables with sensible defaults
 */
export function loadEnvironmentConfig(): EnvironmentConfig {
  return {
    // AI Provider Settings
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

    // Browser Settings
    browser: {
      adapter: process.env.DEFAULT_ADAPTER || 'playwright',
      type: (process.env.DEFAULT_BROWSER as BrowserType) || BrowserType.CHROME,
      headless: process.env.BROWSER_HEADLESS === 'true',
      viewport: {
        width: parseInt(process.env.VIEWPORT_WIDTH || '1920'),
        height: parseInt(process.env.VIEWPORT_HEIGHT || '1080'),
      },
      timeout: parseInt(process.env.DEFAULT_TIMEOUT || '30000'),
    },

    // Debug Settings
    debug: {
      enabled: process.env.DEBUG === 'true',
      logLevel: process.env.LOG_LEVEL || 'info',
      screenshotOnError: process.env.SCREENSHOT_ON_ERROR === 'true',
      screenshotsDir: process.env.SCREENSHOTS_DIR || './screenshots',
    },
  };
}

/**
 * Create AI provider configurations from environment
 */
export function createAIProviderConfigs(envConfig: EnvironmentConfig): Record<string, AIConfig> {
  const configs: Record<string, AIConfig> = {};

  // Ollama (always available)
  configs.ollama = {
    model: envConfig.ollama.model,
    baseUrl: envConfig.ollama.baseUrl,
    temperature: envConfig.ollama.temperature,
  };

  // OpenAI (if API key is provided)
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

/**
 * Check if a provider is available based on configuration
 */
export function isProviderAvailable(provider: string, envConfig: EnvironmentConfig): boolean {
  switch (provider.toLowerCase()) {
    case 'ollama':
      return true; // Always available (assuming Ollama is running)
    case 'openai':
      return !!envConfig.openai.apiKey; // Available if API key is configured
    default:
      return false;
  }
}

/**
 * Get the list of available providers
 */
export function getAvailableProviders(envConfig: EnvironmentConfig): string[] {
  const providers: string[] = [];

  // Ollama is always available
  providers.push('ollama');

  // OpenAI is available if API key is configured
  if (isProviderAvailable('openai', envConfig)) {
    providers.push('openai');
  }

  return providers;
}

/**
 * Validate that the default provider is available
 */
export function validateDefaultProvider(envConfig: EnvironmentConfig): string {
  const requestedProvider = envConfig.defaultProvider;
  const availableProviders = getAvailableProviders(envConfig);

  // Check if the requested provider is available
  if (availableProviders.includes(requestedProvider)) {
    return requestedProvider;
  }

  // Fallback to the first available provider
  console.warn(`⚠️ Requested provider '${requestedProvider}' is not available. Available providers: ${availableProviders.join(', ')}`);
  return availableProviders[0] || 'ollama';
}

/**
 * Log configuration status
 */
export function logConfigurationStatus(envConfig: EnvironmentConfig): void {
  const availableProviders = getAvailableProviders(envConfig);
  const defaultProvider = validateDefaultProvider(envConfig);

  console.log('🔧 Configuration Status:');
  console.log(`   Default Provider: ${defaultProvider}`);
  console.log(`   Available Providers: ${availableProviders.join(', ')}`);
  console.log(`   Browser: ${envConfig.browser.type} (${envConfig.browser.adapter})`);
  console.log(`   Headless: ${envConfig.browser.headless}`);
  console.log(`   Debug: ${envConfig.debug.enabled}`);

  if (envConfig.debug.enabled) {
    console.log('🐛 Debug mode enabled');
    console.log(`   Log Level: ${envConfig.debug.logLevel}`);
    console.log(`   Screenshot on Error: ${envConfig.debug.screenshotOnError}`);
  }
}

// Export default configuration instance
export const envConfig = loadEnvironmentConfig();
