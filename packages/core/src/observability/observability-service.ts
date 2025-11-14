import { CallbackHandler } from '@langfuse/langchain';
import { ObservabilityConfig } from './types';

/**
 * Main observability service using Langfuse CallbackHandler
 *
 * Uses only @langfuse/langchain CallbackHandler for automatic tracing
 * of all LangChain model invocations.
 */
export class ObservabilityService {
  private callbackHandler: CallbackHandler | null = null;
  private enabled: boolean = false;

  constructor(config?: ObservabilityConfig) {
    if (!config?.enabled || !config?.langfuse?.enabled) {
      return;
    }

    this.enabled = true;

    try {
      // Set environment variables for CallbackHandler
      if (config.langfuse.publicKey) {
        process.env.LANGFUSE_PUBLIC_KEY = config.langfuse.publicKey;
      }
      if (config.langfuse.secretKey) {
        process.env.LANGFUSE_SECRET_KEY = config.langfuse.secretKey;
      }
      if (config.langfuse.baseUrl) {
        process.env.LANGFUSE_BASEURL = config.langfuse.baseUrl;
      }

      // Make callbacks blocking (critical for short-lived processes)
      process.env.LANGCHAIN_CALLBACKS_BACKGROUND = 'false';

      // Initialize the LangChain callback handler
      const callbackOptions: any = {};

      if (config.langfuse.sessionName) {
        callbackOptions.sessionId = config.langfuse.sessionName;
      }
      if (config.langfuse.userId) {
        callbackOptions.userId = config.langfuse.userId;
      }
      if (config.langfuse.tags) {
        callbackOptions.tags = config.langfuse.tags;
      }

      this.callbackHandler = new CallbackHandler(callbackOptions);
      console.log('✅ Langfuse CallbackHandler initialized for LangChain integration');

    } catch (error) {
      console.error('❌ Failed to initialize Langfuse CallbackHandler:', error);
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
    const callbacks: CallbackHandler[] = [];

    if (this.callbackHandler) {
      callbacks.push(this.callbackHandler);
    }

    return callbacks;
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
    return this.enabled && this.callbackHandler !== null;
  }

  /**
   * Shutdown observability services
   * 
   * Note: The CallbackHandler automatically flushes traces asynchronously.
   * No explicit shutdown is needed.
   */
  async shutdown(): Promise<void> {
    // CallbackHandler handles flushing automatically
    console.log('✅ Observability services shut down (CallbackHandler flushes automatically)');
  }
}
