import fs from 'fs';
import path from 'path';
import { ObservabilityConfig } from './types';

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
    console.warn('⚠️  Failed to load observability config:', error);
    return loadObservabilityFromEnv();
  }
}

/**
 * Load observability config from theagent.config.js file
 */
function loadObservabilityFromConfigFile(): ObservabilityConfig | undefined {
  // Search for theagent.config.js in current directory and parent directories
  let currentDir = process.cwd();
  
  while (currentDir !== path.dirname(currentDir)) {
    const configPath = path.join(currentDir, 'theagent.config.js');
    
    if (fs.existsSync(configPath)) {
      try {
        // Clear require cache to ensure fresh load
        delete require.cache[require.resolve(configPath)];
        const config = require(configPath);
        
        if (config?.llm?.profiles) {
          const active = config.llm.active || Object.keys(config.llm.profiles)[0];
          const activeLLMProfile = config.llm.profiles[active];
          
          console.log('🔍 Config loader found active LLM profile:', active);
          console.log('🔍 Profile observability config:', JSON.stringify(activeLLMProfile?.observability, null, 2));
          
          if (activeLLMProfile?.observability?.enabled) {
            // Convert unified config format to observability config format
            const observabilityConfig: ObservabilityConfig = {
              enabled: true
            };

            // Add tracing config if available
            if (activeLLMProfile.observability.tracing?.enabled) {
              observabilityConfig.opentelemetry = {
                enabled: true,
                serviceName: activeLLMProfile.observability.tracing.serviceName || 'the-agent-llm',
                endpoint: activeLLMProfile.observability.tracing.endpoint
              };
            }

            // Add Langfuse config if available
            if (activeLLMProfile.observability.langfuse?.enabled) {
              const langfuseConfig = activeLLMProfile.observability.langfuse;
              observabilityConfig.langfuse = {
                enabled: true,
                publicKey: langfuseConfig.publicKey || process.env.LANGFUSE_PUBLIC_KEY || '',
                secretKey: langfuseConfig.secretKey || process.env.LANGFUSE_SECRET_KEY || '',
                baseUrl: langfuseConfig.baseUrl,
                projectId: langfuseConfig.projectId,
                sessionName: langfuseConfig.sessionName
              };
            }

            console.log('✅ Generated observability config:', JSON.stringify(observabilityConfig, null, 2));
            return observabilityConfig;
          }
        }
      } catch (error) {
        console.warn(`⚠️  Failed to load config from ${configPath}:`, error);
      }
    }
    
    currentDir = path.dirname(currentDir);
  }

  return undefined;
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

  // OpenTelemetry configuration
  if (process.env.OTEL_ENABLED === 'true') {
    config.opentelemetry = {
      enabled: true,
      serviceName: process.env.OTEL_SERVICE_NAME || 'the-agent-llm',
      endpoint: process.env.OTEL_ENDPOINT,
    };
  }

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
      console.warn('⚠️  Langfuse is enabled but credentials are missing');
    }
  }

  return config;
}
