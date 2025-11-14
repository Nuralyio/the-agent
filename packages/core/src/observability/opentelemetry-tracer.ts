import { trace, SpanStatusCode, context, Tracer } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ObservabilityConfig } from './types';

/**
 * OpenTelemetry tracer for LLM operations
 */
export class OpenTelemetryTracer {
  private tracer: Tracer | null = null;
  private provider: NodeTracerProvider | null = null;
  private config: ObservabilityConfig['opentelemetry'];

  constructor(config?: ObservabilityConfig['opentelemetry']) {
    this.config = config;
    if (config?.enabled) {
      this.initialize();
    }
  }

  /**
   * Initialize OpenTelemetry tracing
   */
  private initialize(): void {
    try {
      // Create resource with service name
      const resource = new Resource({
        [ATTR_SERVICE_NAME]: this.config?.serviceName || 'the-agent-llm',
      });

      // Create tracer provider
      this.provider = new NodeTracerProvider({
        resource,
      });

      // Create OTLP exporter if endpoint is configured
      if (this.config?.endpoint) {
        const exporter = new OTLPTraceExporter({
          url: this.config.endpoint,
        });
        this.provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
      }

      // Register the provider
      this.provider.register();

      // Get tracer
      this.tracer = trace.getTracer('the-agent-llm', '0.1.0');

      console.log('✅ OpenTelemetry tracer initialized');
    } catch (error) {
      console.error('❌ Failed to initialize OpenTelemetry tracer:', error);
    }
  }

  /**
   * Trace an LLM operation
   */
  async traceOperation<T>(
    operationName: string,
    attributes: Record<string, string | number | boolean>,
    operation: () => Promise<T>
  ): Promise<T> {
    if (!this.tracer) {
      // If tracer is not initialized, just run the operation
      return operation();
    }

    return this.tracer.startActiveSpan(operationName, async (span) => {
      try {
        // Set attributes
        Object.entries(attributes).forEach(([key, value]) => {
          span.setAttribute(key, value);
        });

        // Execute operation
        const result = await operation();

        // Mark span as successful
        span.setStatus({ code: SpanStatusCode.OK });

        return result;
      } catch (error) {
        // Record error
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : String(error),
        });
        span.recordException(error as Error);

        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Shutdown the tracer
   */
  async shutdown(): Promise<void> {
    if (this.provider) {
      await this.provider.shutdown();
      console.log('✅ OpenTelemetry tracer shut down');
    }
  }
}
