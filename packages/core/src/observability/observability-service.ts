import { Langfuse } from 'langfuse';
import { ObservabilityConfig } from './types';

// Constants for configuration
const DEFAULT_LANGFUSE_BASE_URL = 'https://cloud.langfuse.com';
const DEFAULT_FLUSH_AT = 1;
const DEFAULT_FLUSH_INTERVAL_MS = 1000;

// Type definitions for trace objects
interface TraceObject {
  generation: (options: GenerationOptions) => GenerationObject | null;
  span: (options: SpanOptions) => SpanObject | null;
}

interface GenerationOptions {
  name?: string;
  model: string;
  modelParameters?: Record<string, unknown>;
  input?: unknown;
  metadata?: Record<string, unknown>;
}

interface GenerationObject {
  end: (result: EndResult) => void;
}

interface SpanOptions {
  name: string;
  input?: unknown;
  metadata?: Record<string, unknown>;
  startTime?: Date;
}

interface SpanObject {
  end: (result: EndResult) => void;
}

interface EndResult {
  output?: unknown;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  level?: string;
  statusMessage?: string;
  metadata?: Record<string, unknown>;
  endTime?: Date;
}

/**
 * Observability service for LLM tracing using Langfuse
 *
 * Provides manual tracing of LLM calls, tool executions, and other operations.
 * Uses Langfuse SDK for full control over trace lifecycle and flushing.
 */
export class ObservabilityService {
  private langfuse: Langfuse | null = null;
  private enabled = false;
  private readonly sessionId: string | undefined;
  private readonly userId: string | undefined;
  private readonly tags: string[] | undefined;

  constructor(config?: ObservabilityConfig) {
    if (!config?.enabled || !config?.langfuse?.enabled) {
      return;
    }

    if (!config.langfuse.publicKey || !config.langfuse.secretKey) {
      this.logError('Langfuse credentials missing');
      return;
    }

    this.enabled = true;
    this.sessionId = config.langfuse.sessionName;
    this.userId = config.langfuse.userId;
    this.tags = config.langfuse.tags;

    try {
      this.langfuse = new Langfuse({
        publicKey: config.langfuse.publicKey,
        secretKey: config.langfuse.secretKey,
        baseUrl: config.langfuse.baseUrl ?? DEFAULT_LANGFUSE_BASE_URL,
        flushAt: DEFAULT_FLUSH_AT,
        flushInterval: DEFAULT_FLUSH_INTERVAL_MS,
      });

      this.logInfo('Langfuse observability initialized');
    } catch (error) {
      this.logError('Failed to initialize Langfuse', error);
      this.enabled = false;
    }
  }

  private logInfo(message: string): void {
    // Using console for now, can be replaced with proper logger if available
    // eslint-disable-next-line no-console
    console.log(`✅ ${message}`);
  }

  private logError(message: string, error?: unknown): void {
    // Using console for now, can be replaced with proper logger if available
    // eslint-disable-next-line no-console
    console.error(`❌ ${message}`, error || '');
  }

  /**
   * Start a new trace for tracking operations
   */
  startTrace(name: string, metadata?: Record<string, unknown>): TraceObject | null {
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
      this.logError('Failed to create trace', error);
      return null;
    }
  }

  /**
   * Create a generation span for an LLM call
   */
  createGeneration(trace: TraceObject | null, options: {
    name?: string;
    model: string;
    modelParameters?: Record<string, unknown>;
    input?: unknown;
    metadata?: Record<string, unknown>;
  }): GenerationObject | null {
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
      this.logError('Failed to create generation', error);
      return null;
    }
  }

  /**
   * Create a span for a tool/function call
   */
  createSpan(trace: TraceObject | null, options: {
    name: string;
    input?: unknown;
    metadata?: Record<string, unknown>;
    startTime?: Date;
  }): SpanObject | null {
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
      this.logError('Failed to create span', error);
      return null;
    }
  }

  /**
   * Track a tool/function call within a trace
   */
  trackToolCall(trace: TraceObject | null, options: {
    name: string;
    input?: unknown;
    metadata?: Record<string, unknown>;
  }): { end: (result?: Partial<EndResult>) => void; span: SpanObject | null } {
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
      end: (result?: Partial<EndResult>) => {
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
  getCallbacks(): unknown[] {
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
        this.logError('Error flushing traces', error);
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
        this.logInfo('Langfuse shut down');
      } catch (error) {
        this.logError('Error during shutdown', error);
      }
    }
  }
}
