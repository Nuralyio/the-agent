import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, AIMessage as LangChainAIMessage } from '@langchain/core/messages';
import { AIConfig, AIMessage, AIProvider, AIResponse, VisionCapabilities } from '../../engine/ai-engine';
import { BrowserActionSchema } from '../shared/schemas/browser-action.schema';
import { StructuredOutputUtil, createStructuredOutputUtil } from '../shared/utils/structured-output.util';
import { OpenAIModelUtils } from './utils';

/**
 * OpenAI Provider - GPT models from OpenAI using @langchain/openai
 * Supports both text and vision capabilities
 */
export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';
  readonly config: AIConfig;
  readonly visionCapabilities: VisionCapabilities;

  private model: ChatOpenAI;
  private structuredOutputUtil: StructuredOutputUtil;

  constructor(config: AIConfig) {
    if (!config.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.config = {
      baseUrl: 'https://api.openai.com/v1',
      temperature: 0.7,
      maxTokens: 4096,
      timeout: 60000,
      ...config,
      model: config.model || 'gpt-4o'
    };

    // Initialize ChatOpenAI model
    this.model = new ChatOpenAI({
      model: this.config.model,
      apiKey: this.config.apiKey,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
      timeout: this.config.timeout,
      configuration: {
        baseURL: this.config.baseUrl
      }
    });

    // Initialize structured output utility with browser action schema
    this.structuredOutputUtil = createStructuredOutputUtil(BrowserActionSchema);

    // Set vision capabilities based on model
    this.visionCapabilities = OpenAIModelUtils.getVisionCapabilities(this.config.model);
  }

  async generateText(prompt: string, systemPrompt?: string): Promise<AIResponse> {
    const messages = [];

    if (systemPrompt) {
      messages.push(new SystemMessage(systemPrompt));
    }

    messages.push(new HumanMessage(prompt));

    const response = await this.model.invoke(messages);

    return {
      content: response.content as string,
      finishReason: 'stop',
      usage: response.usage_metadata ? {
        promptTokens: response.usage_metadata.input_tokens,
        completionTokens: response.usage_metadata.output_tokens,
        totalTokens: response.usage_metadata.total_tokens
      } : undefined
    };
  }

  async generateStructuredJSON(prompt: string, systemPrompt?: string): Promise<AIResponse> {
    const messages = [];

    if (systemPrompt) {
      messages.push(new SystemMessage(systemPrompt));
    }

    messages.push(new HumanMessage(prompt));

    // Use structured output with JSON mode
    const modelWithJsonMode = this.model.bind({
      response_format: { type: 'json_object' }
    });

    const response = await modelWithJsonMode.invoke(messages);

    return {
      content: response.content as string,
      finishReason: 'stop',
      usage: response.usage_metadata ? {
        promptTokens: response.usage_metadata.input_tokens,
        completionTokens: response.usage_metadata.output_tokens,
        totalTokens: response.usage_metadata.total_tokens
      } : undefined
    };
  }

  async generateWithVision(prompt: string, images: Buffer[], systemPrompt?: string): Promise<AIResponse> {
    if (!this.visionCapabilities.supportsImages) {
      throw new Error(`Model ${this.config.model} does not support vision capabilities`);
    }

    // Validate images
    for (const image of images) {
      const validation = OpenAIModelUtils.validateImage(image, this.config.model);
      if (!validation.valid) {
        throw new Error(`Image validation failed: ${validation.error}`);
      }
    }

    const messages = [];

    if (systemPrompt) {
      messages.push(new SystemMessage(systemPrompt));
    }

    // Create message content with text and images
    const base64Images = OpenAIModelUtils.convertImagesToBase64(images);
    const contentParts = [
      { type: 'text' as const, text: prompt },
      ...base64Images.map(imageUrl => ({
        type: 'image_url' as const,
        image_url: { url: imageUrl, detail: 'high' as const }
      }))
    ];

    messages.push(new HumanMessage({
      content: contentParts
    }));

    const response = await this.model.invoke(messages);

    return {
      content: response.content as string,
      finishReason: 'stop',
      usage: response.usage_metadata ? {
        promptTokens: response.usage_metadata.input_tokens,
        completionTokens: response.usage_metadata.output_tokens,
        totalTokens: response.usage_metadata.total_tokens
      } : undefined
    };
  }

  async generateFromMessages(messages: AIMessage[]): Promise<AIResponse> {
    const langchainMessages = messages.map(msg => {
      if (msg.role === 'system') {
        return new SystemMessage(msg.content);
      } else if (msg.role === 'user') {
        return new HumanMessage(msg.content);
      } else {
        return new LangChainAIMessage(msg.content);
      }
    });

    const response = await this.model.invoke(langchainMessages);

    return {
      content: response.content as string,
      finishReason: 'stop',
      usage: response.usage_metadata ? {
        promptTokens: response.usage_metadata.input_tokens,
        completionTokens: response.usage_metadata.output_tokens,
        totalTokens: response.usage_metadata.total_tokens
      } : undefined
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.model.invoke([new HumanMessage('test')]);
      return true;
    } catch (error) {
      console.error('OpenAI health check failed:', error);
      return false;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      // ChatOpenAI doesn't provide a direct method to list models
      // Return common GPT models as fallback
      return ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];
    } catch (error) {
      console.error('Failed to fetch OpenAI models:', error);
      return ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'];
    }
  }
}
