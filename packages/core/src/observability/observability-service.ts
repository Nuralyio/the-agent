import { AIResponse } from '../engine/ai-engine';
import { LangfuseTracker } from './langfuse-tracker';
import { OpenTelemetryTracer } from './opentelemetry-tracer';
import { LLMCallMetadata, ObservabilityConfig } from './types';

/**
 * Main observability service that coordinates OpenTelemetry and Langfuse
 */
export class ObservabilityService {
  private openTelemetryTracer: OpenTelemetryTracer | null = null;
  private langfuseTracker: LangfuseTracker | null = null;
  private enabled: boolean = false;

  constructor(config?: ObservabilityConfig) {
    if (!config?.enabled) {
      return;
    }

    this.enabled = true;

    // Initialize OpenTelemetry if configured
    if (config.opentelemetry?.enabled) {
      this.openTelemetryTracer = new OpenTelemetryTracer(config.opentelemetry);
    }

    // Initialize Langfuse if configured
    if (config.langfuse?.enabled) {
      this.langfuseTracker = new LangfuseTracker(config.langfuse);
    }
  }

  /**
   * Wrap an LLM call with observability
   */
  async traceLLMCall<T extends AIResponse>(
    provider: string,
    model: string,
    operation: string,
    input: string,
    systemPrompt: string | undefined,
    llmCall: () => Promise<T>
  ): Promise<T> {
    if (!this.enabled) {
      return llmCall();
    }

    const startTime = Date.now();
    const metadata: LLMCallMetadata = {
      provider,
      model,
      operation,
      timestamp: new Date(),
    };

    try {
      // Wrap with OpenTelemetry if available
      const executeCall = async () => {
        return await llmCall();
      };

      const result = this.openTelemetryTracer
        ? await this.openTelemetryTracer.traceOperation(
            `llm.${provider}.${operation}`,
            {
              'llm.provider': provider,
              'llm.model': model,
              'llm.operation': operation,
            },
            executeCall
          )
        : await executeCall();

      // Calculate metrics
      const endTime = Date.now();
      metadata.latency = endTime - startTime;
      metadata.promptTokens = result.usage?.promptTokens;
      metadata.completionTokens = result.usage?.completionTokens;
      metadata.totalTokens = result.usage?.totalTokens;

      // Track with Langfuse
      if (this.langfuseTracker) {
        await this.langfuseTracker.trackGeneration(
          metadata,
          input,
          result.content,
          systemPrompt
        );
      }

      return result;
    } catch (error) {
      // Track error
      metadata.error = error instanceof Error ? error.message : String(error);

      if (this.langfuseTracker) {
        await this.langfuseTracker.trackError(
          metadata,
          input,
          error instanceof Error ? error : new Error(String(error))
        );
      }

      throw error;
    }
  }

  /**
   * Check if observability is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Shutdown all observability services
   */
  async shutdown(): Promise<void> {
    const promises: Promise<void>[] = [];

    if (this.openTelemetryTracer) {
      promises.push(this.openTelemetryTracer.shutdown());
    }

    if (this.langfuseTracker) {
      promises.push(this.langfuseTracker.shutdown());
    }

    await Promise.all(promises);
  }
}
