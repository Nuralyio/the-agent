import { Langfuse } from 'langfuse';
import { ObservabilityConfig, LLMCallMetadata } from './types';

/**
 * Langfuse tracker for LLM operations
 */
export class LangfuseTracker {
  private langfuse: Langfuse | null = null;
  private config: ObservabilityConfig['langfuse'];

  constructor(config?: ObservabilityConfig['langfuse']) {
    this.config = config;
    if (config?.enabled && config.publicKey && config.secretKey) {
      this.initialize();
    }
  }

  /**
   * Initialize Langfuse
   */
  private initialize(): void {
    try {
      this.langfuse = new Langfuse({
        publicKey: this.config!.publicKey!,
        secretKey: this.config!.secretKey!,
        baseUrl: this.config?.baseUrl,
      });

      console.log('✅ Langfuse tracker initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Langfuse tracker:', error);
    }
  }

  /**
   * Track an LLM generation
   */
  async trackGeneration(
    metadata: LLMCallMetadata,
    input: string,
    output: string,
    systemPrompt?: string
  ): Promise<void> {
    if (!this.langfuse) {
      return;
    }

    try {
      const trace = this.langfuse.trace({
        name: `${metadata.provider}.${metadata.operation}`,
        metadata: {
          provider: metadata.provider,
          model: metadata.model,
          operation: metadata.operation,
        },
      });

      trace.generation({
        name: metadata.operation,
        model: metadata.model,
        modelParameters: {
          temperature: 0.7, // This could be made configurable
        },
        input: systemPrompt ? [{ role: 'system', content: systemPrompt }, { role: 'user', content: input }] : input,
        output: output,
        usage: {
          promptTokens: metadata.promptTokens,
          completionTokens: metadata.completionTokens,
          totalTokens: metadata.totalTokens,
        },
        metadata: {
          latency: metadata.latency,
          timestamp: metadata.timestamp.toISOString(),
        },
      });

      // Flush to ensure data is sent
      await this.langfuse.flushAsync();
    } catch (error) {
      console.error('❌ Failed to track LLM generation in Langfuse:', error);
    }
  }

  /**
   * Track an error
   */
  async trackError(
    metadata: LLMCallMetadata,
    input: string,
    error: Error
  ): Promise<void> {
    if (!this.langfuse) {
      return;
    }

    try {
      const trace = this.langfuse.trace({
        name: `${metadata.provider}.${metadata.operation}.error`,
        metadata: {
          provider: metadata.provider,
          model: metadata.model,
          operation: metadata.operation,
          error: error.message,
        },
      });

      trace.event({
        name: 'error',
        input: input,
        metadata: {
          error: error.message,
          stack: error.stack,
          timestamp: metadata.timestamp.toISOString(),
        },
      });

      await this.langfuse.flushAsync();
    } catch (err) {
      console.error('❌ Failed to track error in Langfuse:', err);
    }
  }

  /**
   * Shutdown Langfuse
   */
  async shutdown(): Promise<void> {
    if (this.langfuse) {
      await this.langfuse.shutdownAsync();
      console.log('✅ Langfuse tracker shut down');
    }
  }
}
