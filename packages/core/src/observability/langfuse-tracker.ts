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
      console.log('🔍 Initializing Langfuse tracker...');
      
      // CRITICAL: Make callbacks blocking to ensure traces are captured
      // For LangChain >= 0.3.0, callbacks are backgrounded by default
      // This causes traces to not be flushed in short-lived processes
      process.env.LANGCHAIN_CALLBACKS_BACKGROUND = 'false';
      console.log('✅ Set LANGCHAIN_CALLBACKS_BACKGROUND=false (callbacks are blocking)');
      
      // Set environment variables if provided in config
      if (this.config?.publicKey) {
        process.env.LANGFUSE_PUBLIC_KEY = this.config.publicKey;
        console.log('✅ Set LANGFUSE_PUBLIC_KEY from config');
      }
      if (this.config?.secretKey) {
        process.env.LANGFUSE_SECRET_KEY = this.config.secretKey;
        console.log('✅ Set LANGFUSE_SECRET_KEY from config');
      }
      if (this.config?.baseUrl) {
        process.env.LANGFUSE_BASEURL = this.config.baseUrl;
        console.log(`✅ Set LANGFUSE_BASEURL: ${this.config.baseUrl}`);
      }

      // Create the callback handler with optional session name
      const callbackOptions: any = {};
      if (this.config?.sessionName) {
        callbackOptions.sessionId = this.config.sessionName;
        console.log(`✅ Using session ID: ${this.config.sessionName}`);
      }

      console.log('🚀 Creating Langfuse CallbackHandler...');
      this.callbackHandler = new CallbackHandler(callbackOptions);
      console.log('✅ CallbackHandler created successfully');

      console.log('✅ Langfuse tracker initialized with official LangChain integration');
      if (this.config?.projectId) {
        console.log(`📊 Project: ${this.config.projectId}`);
      }
      if (this.config?.sessionName) {
        console.log(`🎯 Session: ${this.config.sessionName}`);
      }
      console.log('🔗 Credentials configured for Langfuse Cloud');
      console.log('💡 Check your Langfuse dashboard for traces in a few moments...')
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
   * Shutdown Langfuse tracker
   * 
   * The CallbackHandler manages flushing automatically
   */
  async shutdown(): Promise<void> {
    console.log('✅ Langfuse tracker shut down - traces will be sent asynchronously');
  }
}
