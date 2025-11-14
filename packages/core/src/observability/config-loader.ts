import fs from 'fs';
import path from 'path';
import { ObservabilityConfig } from './types';

// Constants
const CONFIG_FILENAME = 'theagent.config.js';

/**
 * Load observability configuration from unified configuration and environment variables
 */
export function loadObservabilityConfig(): ObservabilityConfig | undefined {
  try {
    // Try to load from theagent.config.js first
    const configFromFile = loadObservabilityFromConfigFile();
    if (configFromFile) {
      return configFromFile;
    }

    // Fallback to environment variables (legacy support)
    return loadObservabilityFromEnv();
  } catch (error) {
    logWarning('Failed to load observability config', error);
    return loadObservabilityFromEnv();
  }
}

/**
 * Log warning message
 */
function logWarning(message: string, error?: unknown): void {
  // Using console for now, can be replaced with proper logger if available
  // eslint-disable-next-line no-console
  console.warn(`⚠️  ${message}:`, error || '');
}

/**
 * Log info message (debug only)
 */
function logDebug(message: string, data?: unknown): void {
  // Using console for now, can be replaced with proper logger if available
  // eslint-disable-next-line no-console
  console.log(`🔍 ${message}`, data || '');
}

/**
 * Load observability config from theagent.config.js file
 */
function loadObservabilityFromConfigFile(): ObservabilityConfig | undefined {
  // Search for theagent.config.js in current directory and parent directories
  let currentDir = process.cwd();
  
  while (currentDir !== path.dirname(currentDir)) {
    const configPath = path.join(currentDir, CONFIG_FILENAME);
    
    if (fs.existsSync(configPath)) {
      try {
        // Clear require cache to ensure fresh load
        delete require.cache[require.resolve(configPath)];
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const config = require(configPath);
        
        if (config?.llm?.profiles) {
          const active = config.llm.active || Object.keys(config.llm.profiles)[0];
          const activeLLMProfile = config.llm.profiles[active];
          
          logDebug('Config loader found active LLM profile:', active);
          logDebug('Profile observability config:', JSON.stringify(activeLLMProfile?.observability, null, 2));
          
          if (activeLLMProfile?.observability?.enabled) {
            const observabilityConfig = buildObservabilityConfig(activeLLMProfile);
            logDebug('Generated observability config:', JSON.stringify(observabilityConfig, null, 2));
            return observabilityConfig;
          }
        }
      } catch (error) {
        logWarning(`Failed to load config from ${configPath}`, error);
      }
    }
    
    currentDir = path.dirname(currentDir);
  }

  return undefined;
}

/**
 * Build observability config from LLM profile
 */
function buildObservabilityConfig(activeLLMProfile: any): ObservabilityConfig {
  const observabilityConfig: ObservabilityConfig = {
    enabled: true
  };

  // Add Langfuse config if available
  if (activeLLMProfile.observability.langfuse?.enabled) {
    const langfuseConfig = activeLLMProfile.observability.langfuse;
    observabilityConfig.langfuse = {
      enabled: true,
      publicKey: langfuseConfig.publicKey || process.env.LANGFUSE_PUBLIC_KEY || '',
      secretKey: langfuseConfig.secretKey || process.env.LANGFUSE_SECRET_KEY || '',
      baseUrl: langfuseConfig.baseUrl,
      sessionName: langfuseConfig.sessionName,
      userId: langfuseConfig.userId,
      tags: langfuseConfig.tags
    };
  }

  return observabilityConfig;
}

/**
 * Load observability configuration from environment variables (legacy support)
 */
function loadObservabilityFromEnv(): ObservabilityConfig | undefined {
  const enabled = process.env.OBSERVABILITY_ENABLED === 'true';

  if (!enabled) {
    return undefined;
  }

  const config: ObservabilityConfig = {
    enabled: true,
  };

  // Langfuse configuration
  if (process.env.LANGFUSE_ENABLED === 'true') {
    const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
    const secretKey = process.env.LANGFUSE_SECRET_KEY;

    if (publicKey && secretKey) {
      config.langfuse = {
        enabled: true,
        publicKey,
        secretKey,
        baseUrl: process.env.LANGFUSE_BASEURL,
      };
    } else {
      logWarning('Langfuse is enabled but credentials are missing');
    }
  }

  return config;
}
