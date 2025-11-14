import { CallbackHandler } from '@langfuse/langchain';
import { AIResponse } from '../engine/ai-engine';
import { LangfuseTracker } from './langfuse-tracker';
import { OpenTelemetryTracer } from './opentelemetry-tracer';
import { ObservabilityConfig } from './types';

/**
 * Main observability service that coordinates OpenTelemetry and Langfuse
 * 
 * Uses official LangChain integrations:
 * - @langfuse/langchain for automatic LLM call tracking
 * - OpenTelemetry for distributed tracing
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
   * Get LangChain callbacks for observability
   * 
   * Returns an array of callbacks to pass to LangChain model.invoke():
   * ```typescript
   * await model.invoke(messages, { callbacks: observability.getCallbacks() });
   * ```
   */
  getCallbacks(): CallbackHandler[] {
    const callbacks: CallbackHandler[] = [];

    if (this.langfuseTracker?.isEnabled()) {
      const handler = this.langfuseTracker.getCallbackHandler();
      if (handler) {
        callbacks.push(handler);
      }
    }

    return callbacks;
  }

  /**
   * Wrap an LLM call with OpenTelemetry tracing
   * 
   * Note: Langfuse tracking is handled via LangChain callbacks,
   * this method only adds OpenTelemetry tracing.
   */
  async traceLLMCall<T extends AIResponse>(
    provider: string,
    model: string,
    operation: string,
    llmCall: () => Promise<T>
  ): Promise<T> {
    if (!this.enabled || !this.openTelemetryTracer) {
      return llmCall();
    }

    return this.openTelemetryTracer.traceOperation(
      `llm.${provider}.${operation}`,
      {
        'llm.provider': provider,
        'llm.model': model,
        'llm.operation': operation,
      },
      llmCall
    );
  }

  /**
   * Check if observability is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Check if Langfuse is enabled
   */
  isLangfuseEnabled(): boolean {
    return this.langfuseTracker?.isEnabled() ?? false;
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
