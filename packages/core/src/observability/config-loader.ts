import { ObservabilityConfig } from './types';

/**
 * Load observability configuration from environment variables
 */
export function loadObservabilityConfig(): ObservabilityConfig | undefined {
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
