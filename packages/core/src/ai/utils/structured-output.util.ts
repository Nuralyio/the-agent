import { ChatOllama } from '@langchain/ollama';
import { OutputFixingParser, StructuredOutputParser } from 'langchain/output_parsers';
import { AIConfig, AIResponse } from '../ai-engine';
import { BrowserActionSchema } from '../schemas/browser-action.schema';

/**
 * Utility for generating structured JSON responses using LangChain
 */
export class StructuredOutputUtil {
  private model: ChatOllama;
  private parser: StructuredOutputParser<any>;
  private outputFixingParser: OutputFixingParser<any>;

  constructor(config: AIConfig) {
    // Create the LangChain ChatOllama instance
    this.model = new ChatOllama({
      model: config.model,
      baseUrl: config.baseUrl || 'http://localhost:11434',
      temperature: config.temperature || 0.7,
      ...(config.maxTokens && {
        numPredict: config.maxTokens
      })
    });

    // Create structured output parser with explicit type handling
    this.parser = StructuredOutputParser.fromZodSchema(BrowserActionSchema as any);

    // Create output fixing parser as fallback
    this.outputFixingParser = OutputFixingParser.fromLLM(this.model, this.parser);
  }

  /**
   * Generate structured JSON response using LangChain with structured output parsing
   */
  async generateStructuredJSON(prompt: string, systemPrompt?: string): Promise<AIResponse> {
    try {
      // Get format instructions
      const formatInstructions = this.parser.getFormatInstructions();

      // Combine system prompt with format instructions
      const enhancedSystemPrompt = systemPrompt
        ? `${systemPrompt}\n\n${formatInstructions}`
        : formatInstructions;

      // Enhance the prompt with format requirements
      const enhancedPrompt = `${prompt}\n\n${formatInstructions}`;

      // Generate response using LangChain
      const response = await this.model.invoke([
        { role: 'system', content: enhancedSystemPrompt },
        { role: 'user', content: enhancedPrompt }
      ]);

      // Parse the structured output
      try {
        const parsedOutput = await this.parser.parse(response.content as string);
        return this.createSuccessResponse(parsedOutput);
      } catch (parseError) {
        // Try with output fixing parser
        try {
          const fixedOutput = await this.outputFixingParser.parse(response.content as string);
          return this.createSuccessResponse(fixedOutput);
        } catch (fixError) {
          // Return fallback response with enhanced prompting instructions
          return this.createFallbackResponse(prompt, systemPrompt);
        }
      }
    } catch (error) {
      // Return fallback response with enhanced prompting instructions
      return this.createFallbackResponse(prompt, systemPrompt);
    }
  }

  /**
   * Create success response from parsed output
   */
  private createSuccessResponse(parsedOutput: any): AIResponse {
    return {
      content: JSON.stringify(parsedOutput, null, 2),
      finishReason: 'stop',
      usage: {
        promptTokens: 0, // Ollama doesn't provide token counts
        completionTokens: 0,
        totalTokens: 0
      }
    };
  }

  /**
   * Create fallback response with enhanced prompting
   */
  private createFallbackResponse(prompt: string, systemPrompt?: string): AIResponse {
    const enhancedSystemPrompt = systemPrompt
      ? `${systemPrompt}\n\nCRITICAL: You MUST respond with ONLY valid JSON. No markdown formatting, no code blocks, no comments, no explanations. Only raw JSON that can be parsed directly.`
      : 'CRITICAL: You MUST respond with ONLY valid JSON. No markdown formatting, no code blocks, no comments, no explanations. Only raw JSON that can be parsed directly.';

    const enhancedPrompt = `${prompt}\n\nRemember: Respond with ONLY valid JSON. Example format: {"action": "click", "selector": "#button", "reasoning": "Need to click the submit button"}`;

    // This would be handled by the provider's generateText method
    throw new Error('Fallback to generateText - this should be caught by the provider');
  }
}
