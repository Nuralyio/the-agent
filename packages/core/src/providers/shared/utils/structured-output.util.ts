import { StructuredOutputParser } from 'langchain/output_parsers';
import { z } from 'zod';
import { AIProvider, AIResponse } from '../../../engine/ai-engine';

/**
 * Generic utility for generating structured JSON responses
 * Works with any AI provider that implements the AIProvider interface
 */
export class StructuredOutputUtil {
  private parser: StructuredOutputParser<any>;

  constructor(private schema: z.ZodType<any>) {
    // Create structured output parser with the provided schema
    this.parser = StructuredOutputParser.fromZodSchema(schema as any);
  }

  /**
   * Generate structured JSON response using the provided AI provider
   */
  async generateStructuredJSON(
    provider: AIProvider,
    prompt: string,
    systemPrompt?: string
  ): Promise<AIResponse> {
    // Get format instructions from the schema
    const formatInstructions = this.parser.getFormatInstructions();

    // Combine system prompt with format instructions
    const enhancedSystemPrompt = systemPrompt
      ? `${systemPrompt}\n\n${formatInstructions}`
      : formatInstructions;

    // Enhance the prompt with format requirements
    const enhancedPrompt = `${prompt}\n\n${formatInstructions}`;

    try {
      // Use the provider's generateText method
      const response = await provider.generateText(enhancedPrompt, enhancedSystemPrompt);

      // Try to parse the structured output
      try {
        const parsedOutput = await this.parser.parse(response.content);
        return this.createSuccessResponse(parsedOutput);
      } catch (parseError) {
        // If parsing fails, try with fallback enhanced prompting
        return this.generateWithFallback(provider, prompt, systemPrompt);
      }
    } catch (error) {
      // If generation fails, try with fallback enhanced prompting
      return this.generateWithFallback(provider, prompt, systemPrompt);
    }
  }

  /**
   * Get format instructions for the schema
   */
  getFormatInstructions(): string {
    return this.parser.getFormatInstructions();
  }

  /**
   * Parse a string response into the structured format
   */
  async parseResponse(responseContent: string): Promise<any> {
    return this.parser.parse(responseContent);
  }

  /**
   * Validate that an object matches the schema
   */
  validateStructure(data: any): boolean {
    try {
      this.schema.parse(data);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Private helper methods
   */

  private async generateWithFallback(
    provider: AIProvider,
    prompt: string,
    systemPrompt?: string
  ): Promise<AIResponse> {
    const enhancedSystemPrompt = systemPrompt
      ? `${systemPrompt}\n\nCRITICAL: You MUST respond with ONLY valid JSON. No markdown formatting, no code blocks, no comments, no explanations. Only raw JSON that can be parsed directly.`
      : 'CRITICAL: You MUST respond with ONLY valid JSON. No markdown formatting, no code blocks, no comments, no explanations. Only raw JSON that can be parsed directly.';

    const enhancedPrompt = `${prompt}\n\nRemember: Respond with ONLY valid JSON that matches the required schema.`;

    return provider.generateText(enhancedPrompt, enhancedSystemPrompt);
  }

  private createSuccessResponse(parsedOutput: any): AIResponse {
    return {
      content: JSON.stringify(parsedOutput, null, 2),
      finishReason: 'stop',
      usage: {
        promptTokens: 0, // Provider-specific token counts would be handled by the provider
        completionTokens: 0,
        totalTokens: 0
      }
    };
  }
}

/**
 * Factory function to create a StructuredOutputUtil with a specific schema
 */
export function createStructuredOutputUtil<T>(schema: z.ZodType<T>): StructuredOutputUtil {
  return new StructuredOutputUtil(schema);
}
