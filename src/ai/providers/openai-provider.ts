import axios from 'axios';
import { OutputFixingParser } from 'langchain/output_parsers';
import { z } from 'zod';
import { AIConfig, AIMessage, AIProvider, AIResponse, VisionCapabilities } from '../ai-engine';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIChatRequest {
  model: string;
  messages: OpenAIMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: {
    type: 'json_object';
  };
}

interface OpenAIChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Define the schema for browser actions
const BrowserActionSchema = z.object({
  action: z.enum(['CLICK', 'TYPE', 'WAIT', 'NAVIGATE', 'SCREENSHOT', 'SCROLL']),
  selector: z.string().optional(),
  text: z.string().optional(),
  url: z.string().optional(),
  duration: z.number().optional(),
  reasoning: z.string().optional()
});

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';
  readonly config: AIConfig;
  readonly visionCapabilities: VisionCapabilities;
  private client: OpenAI;

  constructor(config: AIConfig) {
    if (!config.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.config = {
      temperature: 0.7,
      maxTokens: 2048,
      timeout: 30000,
      ...config,
      model: config.model || 'gpt-3.5-turbo'
    };

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      ...(this.config.baseUrl && { baseURL: this.config.baseUrl }),
      timeout: this.config.timeout
    });

    this.visionCapabilities = {
      supportsImages: this.config.model.includes('vision') || this.config.model.includes('gpt-4'),
      supportedFormats: ['png', 'jpeg', 'jpg', 'webp', 'gif'],
      maxImageSize: 20 * 1024 * 1024 // 20MB
    };
  }

  /**
   * Generate text using OpenAI's chat completions API
   */
  async generateText(prompt: string, systemPrompt?: string): Promise<AIResponse> {
    try {
      const messages: OpenAIMessage[] = [];

      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }

      messages.push({ role: 'user', content: prompt });

      const requestData: OpenAIChatRequest = {
        model: this.config.model || 'gpt-3.5-turbo',
        messages,
        temperature: this.config.temperature || 0.7,
        max_tokens: this.config.maxTokens || 1000
      };

      const response = await axios.post<OpenAIChatResponse>(
        'https://api.openai.com/v1/chat/completions',
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: this.config.timeout || 30000
        }
      );

      const choice = response.data.choices[0];
      if (!choice || !choice.message) {
        throw new Error('Invalid response from OpenAI API');
      }

      return {
        content: choice.message.content,
        usage: {
          promptTokens: response.data.usage.prompt_tokens,
          completionTokens: response.data.usage.completion_tokens,
          totalTokens: response.data.usage.total_tokens
        },
        finishReason: choice.finish_reason as 'stop' | 'length' | 'tool_calls' | 'content_filter'
      };

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.error?.message || error.message;
        throw new Error(`OpenAI API error (${status}): ${message}`);
      }
      throw error;
    }
  }

  /**
   * Generate structured JSON using LangChain's structured output parser
   */
  async generateStructuredJSON(prompt: string, systemPrompt?: string): Promise<AIResponse> {
    try {
      // Create the full prompt with format instructions
      const formatInstructions = this.structuredParser.getFormatInstructions();
      const enhancedPrompt = `${prompt}\n\n${formatInstructions}`;

      // Combine system prompt with structured output requirements
      const fullSystemPrompt = systemPrompt
        ? `${systemPrompt}\n\nYou must respond with valid JSON that matches the required schema.`
        : 'You must respond with valid JSON that matches the required schema.';

      // Use LangChain model for generation
      const result = await this.langchainModel.invoke([
        { role: 'system', content: fullSystemPrompt },
        { role: 'user', content: enhancedPrompt }
      ]);

      try {
        // Parse the structured output
        const parsedResult = await this.structuredParser.parse(result.content as string);

        return {
          content: JSON.stringify(parsedResult),
          usage: {
            promptTokens: result.usage_metadata?.input_tokens || 0,
            completionTokens: result.usage_metadata?.output_tokens || 0,
            totalTokens: result.usage_metadata?.total_tokens || 0
          },
          finishReason: 'stop',
          model: this.config.model || 'gpt-3.5-turbo'
        };
      } catch (parseError) {
        // If parsing fails, use OutputFixingParser to attempt to fix the output
        console.warn('Initial parsing failed, attempting to fix output:', parseError);

        const fixingParser = OutputFixingParser.fromLLM(this.langchainModel, this.structuredParser);
        const fixedResult = await fixingParser.parse(result.content as string);

        return {
          content: JSON.stringify(fixedResult),
          usage: {
            promptTokens: result.usage_metadata?.input_tokens || 0,
            completionTokens: result.usage_metadata?.output_tokens || 0,
            totalTokens: result.usage_metadata?.total_tokens || 0
          },
          finishReason: 'stop',
          model: this.config.model || 'gpt-3.5-turbo'
        };
      }

    } catch (error) {
      console.error('LangChain structured output generation failed:', error);
      throw new Error(`LangChain structured output generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate from multiple messages
   */
  async generateFromMessages(messages: AIMessage[]): Promise<AIResponse> {
    try {
      const formattedMessages = messages.map(msg => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content
      }));

      const result = await this.langchainModel.invoke(formattedMessages);

      return {
        content: result.content as string,
        usage: {
          promptTokens: result.usage_metadata?.input_tokens || 0,
          completionTokens: result.usage_metadata?.output_tokens || 0,
          totalTokens: result.usage_metadata?.total_tokens || 0
        },
        finishReason: 'stop',
        model: this.config.model || 'gpt-3.5-turbo'
      };
    } catch (error) {
      throw new Error(`OpenAI message generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Health check for the provider
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.generateText('Hello', 'Respond with "OK"');
      return response.content.toLowerCase().includes('ok');
    } catch (error) {
      console.warn('OpenAI health check failed:', error);
      return false;
    }
  }
}
