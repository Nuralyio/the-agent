/**
 * Types for LLM Observability
 */

export interface ObservabilityConfig {
  /**
   * Enable/disable observability
   */
  enabled?: boolean;

  /**
   * OpenTelemetry configuration
   */
  opentelemetry?: {
    enabled?: boolean;
    serviceName?: string;
    endpoint?: string;
  };

  /**
   * Langfuse configuration
   */
  langfuse?: {
    enabled?: boolean;
    publicKey?: string;
    secretKey?: string;
    baseUrl?: string;
    projectId?: string;
    sessionName?: string;
    userId?: string;
    tags?: string[];
  };
}

export interface LLMCallMetadata {
  provider: string;
  model: string;
  operation: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  latency?: number;
  error?: string;
  timestamp: Date;
}
