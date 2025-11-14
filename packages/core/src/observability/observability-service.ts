import { Langfuse } from 'langfuse';
import { ObservabilityConfig } from './types';

/**
 * Main observability service using manual Langfuse tracing
 *
 * Uses Langfuse SDK directly for manual tracing of LLM calls and tool calls.
 * This provides full control over trace creation and ensures traces are sent.
 */
export class ObservabilityService {
  private langfuse: Langfuse | null = null;
  private enabled: boolean = false;
  private sessionId: string | undefined;
  private userId: string | undefined;
  private tags: string[] | undefined;
  private currentTrace: any = null;

  constructor(config?: ObservabilityConfig) {
    if (!config?.enabled || !config?.langfuse?.enabled) {
      return;
    }

    if (!config.langfuse.publicKey || !config.langfuse.secretKey) {
      console.error('❌ Langfuse credentials missing (publicKey or secretKey)');
      return;
    }

    this.enabled = true;

    try {
      // Initialize Langfuse client for manual tracing
      this.langfuse = new Langfuse({
        publicKey: config.langfuse.publicKey,
        secretKey: config.langfuse.secretKey,
        baseUrl: config.langfuse.baseUrl ?? 'https://cloud.langfuse.com',
        flushAt: 1, // Flush after every event
        flushInterval: 1000, // Flush every second
      });

      // Store session metadata
      this.sessionId = config.langfuse.sessionName;
      this.userId = config.langfuse.userId;
      this.tags = config.langfuse.tags;

      console.log('✅ Langfuse client initialized for manual tracing');
      console.log('📊 Langfuse config:', {
        baseUrl: config.langfuse.baseUrl ?? 'https://cloud.langfuse.com',
        sessionId: this.sessionId,
        userId: this.userId,
        tags: this.tags,
      });

    } catch (error) {
      console.error('❌ Failed to initialize Langfuse client:', error);
      this.enabled = false;
    }
  }

  /**
   * Start a new trace for tracking LLM operations
   *
   * Returns a trace object that can be used to create spans for LLM calls and tool calls
   */
  startTrace(name: string, metadata?: Record<string, any>): any {
    if (!this.langfuse || !this.enabled) {
      return null;
    }

    try {
      const trace = this.langfuse.trace({
        name,
        sessionId: this.sessionId,
        userId: this.userId,
        tags: this.tags,
        metadata,
      });

      this.currentTrace = trace;
      return trace;
    } catch (error) {
      console.error('❌ Failed to create trace:', error);
      return null;
    }
  }

  /**
   * Create a generation span for an LLM call
   *
   * This tracks the LLM invocation with input/output, tokens, latency, etc.
   */
  createGeneration(trace: any, options: {
    name?: string;
    model: string;
    modelParameters?: Record<string, any>;
    input?: any;
    output?: any;
    usage?: {
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
    };
    metadata?: Record<string, any>;
  }): any {
    if (!this.langfuse || !this.enabled || !trace) {
      return null;
    }

    try {
      const generation = trace.generation({
        name: options.name || 'llm-call',
        model: options.model,
        modelParameters: options.modelParameters,
        input: options.input,
        output: options.output,
        usage: options.usage,
        metadata: options.metadata,
      });

      return generation;
    } catch (error) {
      console.error('❌ Failed to create generation:', error);
      return null;
    }
  }

  /**
   * Create a span for a tool/function call
   *
   * This tracks function executions, tool calls, or any other operations
   */
  createSpan(trace: any, options: {
    name: string;
    input?: any;
    output?: any;
    metadata?: Record<string, any>;
    startTime?: Date;
    endTime?: Date;
  }): any {
    if (!this.langfuse || !this.enabled || !trace) {
      return null;
    }

    try {
      const span = trace.span({
        name: options.name,
        input: options.input,
        output: options.output,
        metadata: options.metadata,
        startTime: options.startTime,
        endTime: options.endTime,
      });

      return span;
    } catch (error) {
      console.error('❌ Failed to create span:', error);
      return null;
    }
  }

  /**
   * Get LangChain callbacks for observability (legacy support)
   *
   * Returns empty array - we use manual tracing instead
   */
  getCallbacks(): any[] {
    // Return empty array - we're using manual tracing instead of CallbackHandler
    return [];
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
    return this.enabled && this.langfuse !== null;
  }

  /**
   * Get the Langfuse client for direct access
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
        console.log('✅ Flushed Langfuse traces');
      } catch (error) {
        console.error('❌ Error flushing Langfuse traces:', error);
      }
    }
  }

  /**
   * Track a tool/function call within a trace
   *
   * Example usage:
   * ```typescript
   * const trace = observabilityService.startTrace('my-operation');
   * const toolSpan = observabilityService.trackToolCall(trace, {
   *   name: 'click-button',
   *   input: { selector: '#submit' },
   * });
   *
   * try {
   *   const result = await clickButton('#submit');
   *   toolSpan.end({ output: { success: true } });
   * } catch (error) {
   *   toolSpan.end({ level: 'ERROR', statusMessage: error.message });
   * }
   * ```
   */
  trackToolCall(trace: any, options: {
    name: string;
    input?: any;
    metadata?: Record<string, any>;
  }): any {
    if (!trace) {
      return null;
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
          span.end({
            output: result?.output,
            level: result?.level,
            statusMessage: result?.statusMessage,
            metadata: {
              ...result?.metadata,
              endTime: endTime.toISOString(),
              duration: endTime.getTime() - startTime.getTime(),
            },
            endTime,
          });
        }
      },
      span,
    };
  }

  /**
   * Shutdown observability services
   *
   * Flushes and shuts down the Langfuse client to ensure all traces are sent.
   */
  async shutdown(): Promise<void> {
    if (this.langfuse) {
      try {
        // Flush pending traces
        await this.langfuse.flushAsync();
        // Shutdown the client
        await this.langfuse.shutdownAsync();
        console.log('✅ Langfuse client flushed and shut down');
      } catch (error) {
        console.error('❌ Error during Langfuse shutdown:', error);
      }
    }
  }
}
