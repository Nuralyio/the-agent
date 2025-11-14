import { CallbackHandler } from '@langfuse/langchain';
import { ObservabilityConfig } from './types';

/**
 * Langfuse tracker for LLM operations using official LangChain integration
 * 
 * Uses the official @langfuse/langchain CallbackHandler which automatically
 * tracks all LangChain operations including LLM calls, chains, and agents.
 * 
 * The CallbackHandler reads credentials from environment variables:
 * - LANGFUSE_PUBLIC_KEY
 * - LANGFUSE_SECRET_KEY
 * - LANGFUSE_BASEURL (optional)
 */
export class LangfuseTracker {
  private callbackHandler: CallbackHandler | null = null;
  private config: ObservabilityConfig['langfuse'];

  constructor(config?: ObservabilityConfig['langfuse']) {
    this.config = config;
    if (config?.enabled) {
      this.initialize();
    }
  }

  /**
   * Initialize Langfuse CallbackHandler
   * 
   * The CallbackHandler automatically reads credentials from environment variables.
   * We set them before initialization if provided in config.
   */
  private initialize(): void {
    try {
      // Set environment variables if provided in config
      if (this.config?.publicKey) {
        process.env.LANGFUSE_PUBLIC_KEY = this.config.publicKey;
      }
      if (this.config?.secretKey) {
        process.env.LANGFUSE_SECRET_KEY = this.config.secretKey;
      }
      if (this.config?.baseUrl) {
        process.env.LANGFUSE_BASEURL = this.config.baseUrl;
      }

      // Create the callback handler
      this.callbackHandler = new CallbackHandler();

      console.log('✅ Langfuse tracker initialized with official LangChain integration');
    } catch (error) {
      console.error('❌ Failed to initialize Langfuse tracker:', error);
    }
  }

  /**
   * Get the LangChain callback handler for use in LLM calls
   * 
   * This handler should be passed to LangChain model.invoke() calls:
   * ```typescript
   * await model.invoke(messages, { callbacks: [langfuseTracker.getCallbackHandler()] });
   * ```
   */
  getCallbackHandler(): CallbackHandler | null {
    return this.callbackHandler;
  }

  /**
   * Check if tracker is enabled
   */
  isEnabled(): boolean {
    return this.callbackHandler !== null;
  }

  /**
   * Shutdown Langfuse (no-op for this handler)
   * 
   * The CallbackHandler automatically flushes data asynchronously.
   */
  async shutdown(): Promise<void> {
    if (this.callbackHandler) {
      console.log('✅ Langfuse tracker shut down');
    }
  }
}
