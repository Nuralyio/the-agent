import { CallbackHandler } from '@langfuse/langchain';
import { Langfuse } from 'langfuse';
import { AIResponse } from '../engine/ai-engine';
import { ObservabilityConfig } from './types';

/**
 * Main observability service using Langfuse CallbackHandler
 *
 * Simplified implementation using only @langfuse/langchain CallbackHandler
 * which should work with LangChain model invocations.
 */
export class ObservabilityService {
  private callbackHandler: CallbackHandler | null = null;
  private langfuse: Langfuse | null = null;
  private enabled: boolean = false;

  constructor(config?: ObservabilityConfig) {
    console.log('🔍 ObservabilityService constructor called with config:', JSON.stringify(config, null, 2));

    if (!config?.enabled || !config?.langfuse?.enabled) {
      console.log('⚠️ Observability is disabled or no Langfuse config provided');
      return;
    }

    this.enabled = true;
    console.log('✅ Observability enabled');

    try {
      // Initialize Langfuse client
      console.log('🚀 Initializing Langfuse client...', {
        publicKey: config.langfuse.publicKey!,
        secretKey: config.langfuse.secretKey!,
        baseUrl: config.langfuse.baseUrl ?? 'https://cloud.langfuse.com',
        enabled: true,
        flushAt: 1, // Flush after every event for testing
        flushInterval: 100, // Flush every 100ms
      });
      this.langfuse = new Langfuse({
        publicKey: config.langfuse.publicKey!,
        secretKey: config.langfuse.secretKey!,
        baseUrl: config.langfuse.baseUrl ?? 'https://cloud.langfuse.com',
        enabled: true,
        flushAt: 1, // Flush after every event for testing
        flushInterval: 100, // Flush every 100ms
      });
      console.log('✅ Langfuse client initialized with flushAt=1');
      console.log(`📊 Langfuse config: publicKey=${config.langfuse.publicKey?.substring(0, 15)}..., baseUrl=${config.langfuse.baseUrl}`);

      // Set environment variables for CallbackHandler
      if (config.langfuse.publicKey) {
        process.env.LANGFUSE_PUBLIC_KEY = config.langfuse.publicKey;
        console.log('✅ Set LANGFUSE_PUBLIC_KEY');
      }
      if (config.langfuse.secretKey) {
        process.env.LANGFUSE_SECRET_KEY = config.langfuse.secretKey;
        console.log('✅ Set LANGFUSE_SECRET_KEY');
      }
      if (config.langfuse.baseUrl) {
        process.env.LANGFUSE_BASE_URL = config.langfuse.baseUrl;
        console.log(`✅ Set LANGFUSE_BASE_URL: ${config.langfuse.baseUrl}`);
      }

      // Make callbacks blocking (critical for short-lived processes)
      process.env.LANGCHAIN_CALLBACKS_BACKGROUND = 'false';
      console.log('✅ Set LANGCHAIN_CALLBACKS_BACKGROUND=false');

      // Initialize the LangChain callback handler
      console.log('🚀 Creating Langfuse CallbackHandler...');
      const callbackOptions: any = {};

      if (config.langfuse.sessionName) {
        callbackOptions.sessionId = config.langfuse.sessionName;
        console.log(`✅ Using session ID: ${config.langfuse.sessionName}`);
      }
      if (config.langfuse.userId) {
        callbackOptions.userId = config.langfuse.userId;
        console.log(`✅ Using user ID: ${config.langfuse.userId}`);
      }
      if (config.langfuse.tags) {
        callbackOptions.tags = config.langfuse.tags;
        console.log(`✅ Using tags: ${config.langfuse.tags.join(', ')}`);
      }

      this.callbackHandler = new CallbackHandler(callbackOptions);
      console.log('✅ CallbackHandler created successfully');
      console.log(`📊 CallbackHandler config: sessionId=${callbackOptions.sessionId}, userId=${callbackOptions.userId || 'none'}, tags=${callbackOptions.tags?.join(',') || 'none'}`);

      // Test Langfuse connection with a test trace
      console.log('🧪 Creating test trace to verify Langfuse connection...');
      const testTrace = this.langfuse.trace({
        name: 'test-connection',
        input: { test: 'Langfuse initialization test' },
        sessionId: callbackOptions.sessionId || 'test-session',
      });
      testTrace.update({ output: { status: 'success' } });
      console.log('✅ Test trace created successfully');

    } catch (error) {
      console.error('❌ Failed to initialize Langfuse observability:', error);
      this.enabled = false;
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
    console.log('🔍 ObservabilityService.getCallbacks() called');
    const callbacks: CallbackHandler[] = [];

    if (this.callbackHandler) {
      console.log('✅ Returning Langfuse callback handler');
      callbacks.push(this.callbackHandler);
    } else {
      console.log('⚠️ Langfuse callback handler is not available');
    }

    console.log(`🔍 Returning ${callbacks.length} callback(s) for observability`);
    return callbacks;
  }

  /**
   * Wrap an LLM call with proper Langfuse tracing
   * Creates a generation with input/output capture
   */
  async traceLLMCall<T extends AIResponse>(
    provider: string,
    model: string,
    operation: string,
    llmCall: () => Promise<T>,
    input?: any
  ): Promise<T> {
    console.log(`🔍 traceLLMCall called: ${provider}/${model}/${operation}`);
    
    if (!this.langfuse) {
      console.log('⚠️ No Langfuse client, executing without tracing');
      return llmCall();
    }

    // Create a manual generation trace with input
    console.log('📊 Creating Langfuse generation with input...');
    const generation = this.langfuse.generation({
      name: `${provider}-${operation}`,
      model: model,
      input: input, // Capture the input
      modelParameters: {
        provider: provider,
        operation: operation,
      },
      metadata: {
        provider,
        model,
        operation,
      },
    });

    try {
      const startTime = Date.now();
      const result = await llmCall();
      const duration = Date.now() - startTime;

      // Update generation with results
      generation.update({
        output: result.content, // Full output
        usage: {
          input: result.usage?.promptTokens || 0,
          output: result.usage?.completionTokens || 0,
          total: result.usage?.totalTokens || 0,
        },
        metadata: {
          duration_ms: duration,
          content_length: result.content.length,
        },
      });
      
      generation.end();
      console.log(`✅ Generation traced with input/output: ${duration}ms`);
      
      return result;
    } catch (error) {
      generation.update({
        level: 'ERROR',
        statusMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      generation.end();
      throw error;
    }
  }

  /**
   * Get the Langfuse client for creating parent traces
   */
  getLangfuseClient(): Langfuse | null {
    return this.langfuse;
  }  /**
   * Check if observability is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Check if Langfuse is enabled
   */
  isLangfuseEnabled(): boolean {
    return this.enabled && this.callbackHandler !== null;
  }

  /**
   * Shutdown all observability services and flush traces
   */
  async shutdown(): Promise<void> {
    console.log('🔍 Shutting down observability services...');

    if (this.langfuse) {
      console.log('📡 Flushing Langfuse client...');
      await this.langfuse.flushAsync();
      console.log('✅ Langfuse client flushed');

      console.log('📡 Shutting down Langfuse client...');
      await this.langfuse.shutdownAsync();
      console.log('✅ Langfuse client shut down');
    }

    console.log('✅ Observability services shut down');
  }
}
