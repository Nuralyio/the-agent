/**
 * Types for LLM Observability
 */

export interface ObservabilityConfig {
  /**
   * Enable/disable observability
   */
  enabled?: boolean;

  /**
   * Langfuse configuration
   */
  langfuse?: {
    enabled?: boolean;
    publicKey?: string;
    secretKey?: string;
    baseUrl?: string;
    sessionName?: string;
    userId?: string;
    tags?: string[];
  };
}
