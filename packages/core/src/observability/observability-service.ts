import { Langfuse } from 'langfuse';
import { ObservabilityConfig } from './types';

/**
 * Observability service for LLM tracing using Langfuse
 *
 * Provides manual tracing of LLM calls, tool executions, and other operations.
 * Uses Langfuse SDK for full control over trace lifecycle and flushing.
 */
export class ObservabilityService {
  private langfuse: Langfuse | null = null;
  private enabled: boolean = false;
  private sessionId: string | undefined;
  private userId: string | undefined;
  private tags: string[] | undefined;

  constructor(config?: ObservabilityConfig) {
    if (!config?.enabled || !config?.langfuse?.enabled) {
      return;
    }

    if (!config.langfuse.publicKey || !config.langfuse.secretKey) {
      console.error('❌ Langfuse credentials missing');
      return;
    }

    this.enabled = true;

    try {
      this.langfuse = new Langfuse({
        publicKey: config.langfuse.publicKey,
        secretKey: config.langfuse.secretKey,
        baseUrl: config.langfuse.baseUrl ?? 'https://cloud.langfuse.com',
        flushAt: 1,
        flushInterval: 1000,
      });

      this.sessionId = config.langfuse.sessionName;
      this.userId = config.langfuse.userId;
      this.tags = config.langfuse.tags;

      console.log('✅ Langfuse observability initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Langfuse:', error);
      this.enabled = false;
    }
  }

  /**
   * Start a new trace for tracking operations
   */
  startTrace(name: string, metadata?: Record<string, any>): any {
    if (!this.langfuse || !this.enabled) {
      return null;
    }

    try {
      return this.langfuse.trace({
        name,
        sessionId: this.sessionId,
        userId: this.userId,
        tags: this.tags,
        metadata,
      });
    } catch (error) {
      console.error('❌ Failed to create trace:', error);
      return null;
    }
  }

  /**
   * Create a generation span for an LLM call
   */
  createGeneration(trace: any, options: {
    name?: string;
    model: string;
    modelParameters?: Record<string, any>;
    input?: any;
    metadata?: Record<string, any>;
  }): any {
    if (!trace) {
      return null;
    }

    try {
      return trace.generation({
        name: options.name || 'llm-call',
        model: options.model,
        modelParameters: options.modelParameters,
        input: options.input,
        metadata: options.metadata,
      });
    } catch (error) {
      console.error('❌ Failed to create generation:', error);
      return null;
    }
  }

  /**
   * Create a span for a tool/function call
   */
  createSpan(trace: any, options: {
    name: string;
    input?: any;
    metadata?: Record<string, any>;
    startTime?: Date;
  }): any {
    if (!trace) {
      return null;
    }

    try {
      return trace.span({
        name: options.name,
        input: options.input,
        metadata: options.metadata,
        startTime: options.startTime,
      });
    } catch (error) {
      console.error('❌ Failed to create span:', error);
      return null;
    }
  }

  /**
   * Track a tool/function call within a trace
   */
  trackToolCall(trace: any, options: {
    name: string;
    input?: any;
    metadata?: Record<string, any>;
  }): any {
    if (!trace) {
      return { end: () => {}, span: null };
    }

    const startTime = new Date();
    const span = this.createSpan(trace, {
      name: options.name,
      input: options.input,
      metadata: {
        ...options.metadata,
        startTime: startTime.toISOString(),
      },
      startTime,
    });

    return {
      end: (result?: { output?: any; level?: string; statusMessage?: string; metadata?: Record<string, any> }) => {
        if (span) {
          const endTime = new Date();
          const duration = endTime.getTime() - startTime.getTime();
          span.end({
            output: result?.output,
            level: result?.level,
            statusMessage: result?.statusMessage,
            metadata: {
              ...result?.metadata,
              endTime: endTime.toISOString(),
              duration,
            },
            endTime,
          });
        }
      },
      span,
    };
  }

  /**
   * Get LangChain callbacks (returns empty array - not used)
   */
  getCallbacks(): any[] {
    return [];
  }

  /**
   * Check if observability is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get the Langfuse client
   */
  getLangfuseClient(): Langfuse | null {
    return this.langfuse;
  }

  /**
   * Flush pending traces to Langfuse
   */
  async flush(): Promise<void> {
    if (this.langfuse) {
      try {
        await this.langfuse.flushAsync();
      } catch (error) {
        console.error('❌ Error flushing traces:', error);
      }
    }
  }

  /**
   * Shutdown observability services
   */
  async shutdown(): Promise<void> {
    if (this.langfuse) {
      try {
        await this.langfuse.flushAsync();
        await this.langfuse.shutdownAsync();
        console.log('✅ Langfuse shut down');
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
      }
    }
  }
}
