import { AIEngine } from '../engine/ai-engine';

export interface AIServiceOptions {
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Handles AI communication for action planning
 */
export class AIService {
  private options: Required<AIServiceOptions>;

  constructor(
    private aiEngine: AIEngine,
    options: AIServiceOptions = {}
  ) {
    this.options = {
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 500
    };
  }

  /**
   * Generate structured response using AI
   */
  async generateStructuredResponse(
    userPrompt: string,
    systemPrompt: string,
    parentTrace?: any
  ): Promise<string> {
    console.log(`🔄 Using structured output for better reliability`);

    const response = await this.aiEngine.generateStructuredJSON(userPrompt, systemPrompt, parentTrace);
    console.log(`✅ Successfully got structured response`);

    return response.content;
  }

  /**
   * Generate text response with retries and fallback
   */
  async generateTextWithRetries(
    userPrompt: string,
    systemPrompt: string,
    parentTrace?: any
  ): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.options.maxRetries; attempt++) {
      try {
        console.log(`🔄 Fallback attempt ${attempt}/${this.options.maxRetries} to get valid JSON from LLM`);

        const response = await this.aiEngine.generateText(userPrompt, systemPrompt, parentTrace);
        console.log(`📊 Response stats: ${response.content.length} chars`);
        console.log(`✅ Successfully got valid JSON on attempt ${attempt}`);

        return response.content;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`⚠️ Fallback attempt ${attempt} failed: ${lastError.message}`);

        if (attempt === this.options.maxRetries) {
          console.error(`❌ All ${this.options.maxRetries} fallback attempts failed to get valid JSON`);
          break;
        }

        // Wait before retrying
        await this.delay(this.options.retryDelay);
      }
    }

    throw new Error(
      `Failed to get valid JSON after ${this.options.maxRetries} attempts. Last error: ${lastError?.message}`
    );
  }

  /**
   * Delay execution for specified milliseconds
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
