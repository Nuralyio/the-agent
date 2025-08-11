import { ChatOllama } from '@langchain/ollama';
import axios from 'axios';
import { OutputFixingParser, StructuredOutputParser } from 'langchain/output_parsers';
import { z } from 'zod';
import { AIConfig, AIMessage, AIProvider, AIResponse, VisionCapabilities } from '../ai-engine';
import { PromptTemplate } from '../../prompt-template';

// Define the schema for structured browser actions
const BrowserActionSchema = z.object({
  action: z.enum(['click', 'type', 'scroll', 'wait', 'hover', 'extract']).describe('The action to perform'),
  selector: z.string().optional().describe('CSS selector for the target element'),
  value: z.string().optional().describe('Value to type or text to extract'),
  coordinates: z.object({
    x: z.number(),
    y: z.number()
  }).optional().describe('X,Y coordinates for click or hover actions'),
  waitTime: z.number().optional().describe('Time to wait in milliseconds'),
  scrollDirection: z.enum(['up', 'down', 'left', 'right']).optional().describe('Direction to scroll'),
  scrollAmount: z.number().optional().describe('Amount to scroll in pixels'),
  reasoning: z.string().describe('Explanation of why this action is needed')
});

interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  system?: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;
  };
}

interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

interface OllamaChatRequest {
  model: string;
  messages: Array<{
    role: string;
    content: string;
    images?: string[];
  }>;
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;
  };
}

/**
 * Ollama AI Provider - Local AI models
 */
export class OllamaProvider implements AIProvider {
  readonly name = 'ollama';
  readonly config: AIConfig;
  readonly visionCapabilities: VisionCapabilities;
  private promptTemplate: PromptTemplate;

  constructor(config: AIConfig) {
    this.config = {
      baseUrl: 'http://localhost:11434',
      temperature: 0.7,
      maxTokens: 2048,
      timeout: 30000,
      ...config,
      model: config.model || 'llama2'
    };

    this.promptTemplate = new PromptTemplate();

    // Check if model supports vision (llava models)
    const isVisionModel = this.config.model.toLowerCase().includes('llava');
    this.visionCapabilities = {
      supportsImages: isVisionModel,
      supportedFormats: ['png', 'jpeg', 'jpg', 'webp'],
      maxImageSize: 20 * 1024 * 1024 // 20MB
    };
  }

  async generateText(prompt: string, systemPrompt?: string): Promise<AIResponse> {
    try {
      const request: OllamaGenerateRequest = {
        model: this.config.model,
        prompt,
        stream: false
      };

      if (systemPrompt) {
        request.system = systemPrompt;
      }

      if (this.config.temperature !== undefined || this.config.maxTokens !== undefined) {
        request.options = {};
        if (this.config.temperature !== undefined) {
          request.options.temperature = this.config.temperature;
        }
        if (this.config.maxTokens !== undefined) {
          request.options.num_predict = this.config.maxTokens;
        }
      }

      const response = await axios.post<OllamaGenerateResponse>(
        `${this.config.baseUrl}/api/generate`,
        request,
        {
          ...(this.config.timeout && { timeout: this.config.timeout }),
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        content: response.data.response,
        finishReason: response.data.done ? 'stop' : 'length',
        usage: {
          promptTokens: response.data.prompt_eval_count || 0,
          completionTokens: response.data.eval_count || 0,
          totalTokens: (response.data.prompt_eval_count || 0) + (response.data.eval_count || 0)
        }
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Ollama API error: ${error.message} - ${error.response?.data?.error || 'Unknown error'}`);
      }
      throw error;
    }
  }

  async generateWithVision(prompt: string, images: Buffer[], systemPrompt?: string): Promise<AIResponse> {
    if (!this.visionCapabilities.supportsImages) {
      throw new Error(`Model ${this.config.model} does not support vision capabilities`);
    }

    try {
      // Convert images to base64
      const imageStrings = images.map(img => img.toString('base64'));

      const messages: Array<{ role: string; content: string; images?: string[] }> = [];

      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }

      messages.push({
        role: 'user',
        content: prompt,
        images: imageStrings
      });

      const request: OllamaChatRequest = {
        model: this.config.model,
        messages,
        stream: false
      };

      if (this.config.temperature !== undefined || this.config.maxTokens !== undefined) {
        request.options = {};
        if (this.config.temperature !== undefined) {
          request.options.temperature = this.config.temperature;
        }
        if (this.config.maxTokens !== undefined) {
          request.options.num_predict = this.config.maxTokens;
        }
      }

      const response = await axios.post(
        `${this.config.baseUrl}/api/chat`,
        request,
        {
          ...(this.config.timeout && { timeout: this.config.timeout }),
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        content: response.data.message.content,
        finishReason: response.data.done ? 'stop' : 'length'
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Ollama Vision API error: ${error.message} - ${error.response?.data?.error || 'Unknown error'}`);
      }
      throw error;
    }
  }

  async generateFromMessages(messages: AIMessage[]): Promise<AIResponse> {
    try {
      const ollamaMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const request: OllamaChatRequest = {
        model: this.config.model,
        messages: ollamaMessages,
        stream: false
      };

      if (this.config.temperature !== undefined || this.config.maxTokens !== undefined) {
        request.options = {};
        if (this.config.temperature !== undefined) {
          request.options.temperature = this.config.temperature;
        }
        if (this.config.maxTokens !== undefined) {
          request.options.num_predict = this.config.maxTokens;
        }
      }

      const response = await axios.post(
        `${this.config.baseUrl}/api/chat`,
        request,
        {
          ...(this.config.timeout && { timeout: this.config.timeout }),
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        content: response.data.message.content,
        finishReason: response.data.done ? 'stop' : 'length'
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Ollama Chat API error: ${error.message} - ${error.response?.data?.error || 'Unknown error'}`);
      }
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.config.baseUrl}/api/tags`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.config.baseUrl}/api/tags`, {
        timeout: 10000
      });

      return response.data.models?.map((model: any) => model.name) || [];
    } catch (error) {
      console.error('Failed to fetch Ollama models:', error);
      return [];
    }
  }

  /**
   * Pull a model from Ollama registry
   */
  async pullModel(modelName: string): Promise<void> {
    try {
      await axios.post(
        `${this.config.baseUrl}/api/pull`,
        { name: modelName },
        { timeout: 300000 } // 5 minutes for model download
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to pull model ${modelName}: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Check if a specific model is available
   */
  async isModelAvailable(modelName: string): Promise<boolean> {
    const models = await this.getAvailableModels();
    return models.some(model => model.includes(modelName));
  }

  /**
   * Generate structured JSON response using LangChain with structured output parsing
   */
  async generateStructuredJSON(prompt: string, systemPrompt?: string): Promise<AIResponse> {
    try {
      // Create the LangChain ChatOllama instance
      const model = new ChatOllama({
        model: this.config.model,
        baseUrl: this.config.baseUrl || 'http://localhost:11434',
        temperature: this.config.temperature || 0.7,
        // Ollama doesn't use API keys, but we can pass other config
        ...(this.config.maxTokens && {
          numPredict: this.config.maxTokens
        })
      });

      // Create structured output parser with explicit type handling
      const parser = StructuredOutputParser.fromZodSchema(BrowserActionSchema as any);

      // Create output fixing parser as fallback
      const outputFixingParser = OutputFixingParser.fromLLM(model, parser);

      // Get format instructions
      const formatInstructions = parser.getFormatInstructions();

      // Combine system prompt with format instructions
      const enhancedSystemPrompt = systemPrompt
        ? `${systemPrompt}\n\n${formatInstructions}`
        : formatInstructions;

      // Enhance the prompt with format requirements
      const enhancedPrompt = `${prompt}\n\n${formatInstructions}`;

      // Generate response using LangChain
      const response = await model.invoke([
        { role: 'system', content: enhancedSystemPrompt },
        { role: 'user', content: enhancedPrompt }
      ]);

      // Parse the structured output
      try {
        const parsedOutput = await parser.parse(response.content as string);

        return {
          content: JSON.stringify(parsedOutput, null, 2),
          finishReason: 'stop',
          usage: {
            promptTokens: 0, // Ollama doesn't provide token counts
            completionTokens: 0,
            totalTokens: 0
          }
        };
      } catch (parseError) {
        // Try with output fixing parser
        try {
          const fixedOutput = await outputFixingParser.parse(response.content as string);

          return {
            content: JSON.stringify(fixedOutput, null, 2),
            finishReason: 'stop',
            usage: {
              promptTokens: 0,
              completionTokens: 0,
              totalTokens: 0
            }
          };
        } catch (fixError) {
          // Fallback to enhanced prompting using template
          const structuredJsonPrompt = this.promptTemplate.render('structured-json', {});
          const enhancedSystemPromptFallback = systemPrompt
            ? `${systemPrompt}\n\n${structuredJsonPrompt}`
            : structuredJsonPrompt;

          const enhancedPromptFallback = `${prompt}\n\nRemember: Respond with ONLY valid JSON. Example format: {"action": "click", "selector": "#button", "reasoning": "Need to click the submit button"}`;

          return this.generateText(enhancedPromptFallback, enhancedSystemPromptFallback);
        }
      }
    } catch (error) {
      // Fallback to the original method using template
      const structuredJsonPrompt = this.promptTemplate.render('structured-json', {});
      const enhancedSystemPrompt = systemPrompt
        ? `${systemPrompt}\n\n${structuredJsonPrompt}`
        : structuredJsonPrompt;

      const enhancedPrompt = `${prompt}\n\nRemember: Respond with ONLY valid JSON. Example format: {"action": "click", "selector": "#button", "reasoning": "Need to click the submit button"}`;

      return this.generateText(enhancedPrompt, enhancedSystemPrompt);
    }
  }
}
