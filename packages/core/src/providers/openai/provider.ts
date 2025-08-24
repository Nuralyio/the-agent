import { AIConfig, AIMessage, AIProvider, AIResponse, VisionCapabilities } from '../../engine/ai-engine';
import { BrowserActionSchema } from '../shared/schemas/browser-action.schema';
import { StructuredOutputUtil, createStructuredOutputUtil } from '../shared/utils/structured-output.util';
import { OpenAIApiClient } from './api-client';
import {
  OpenAICompletionRequest,
  OpenAIMessage,
  OpenAIMessageContent
} from './types';
import { OpenAIModelUtils } from './utils';

/**
 * OpenAI Provider - GPT models from OpenAI
 * Supports both text and vision capabilities
 */
export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';
  readonly config: AIConfig;
  readonly visionCapabilities: VisionCapabilities;

  private apiClient: OpenAIApiClient;
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

    // Initialize API client
    this.apiClient = new OpenAIApiClient(
      this.config.apiKey!,
      this.config.baseUrl,
      this.config.timeout
    );

    // Initialize structured output utility with browser action schema
    this.structuredOutputUtil = createStructuredOutputUtil(BrowserActionSchema);

    // Set vision capabilities based on model
    this.visionCapabilities = OpenAIModelUtils.getVisionCapabilities(this.config.model);
  }

  async generateText(prompt: string, systemPrompt?: string): Promise<AIResponse> {
    const messages: OpenAIMessage[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content: prompt });

    const request: OpenAICompletionRequest = {
      model: this.config.model,
      messages,
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens
    };

    const response = await this.apiClient.createChatCompletion(request);

    if (!response.choices || response.choices.length === 0) {
      throw new Error('No response choices returned from OpenAI API');
    }

    const choice = response.choices[0];

    return {
      content: this.extractTextContent(choice.message.content),
      finishReason: choice.finish_reason || 'stop',
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens
      } : undefined
    };
  }

  async generateStructuredJSON(prompt: string, systemPrompt?: string): Promise<AIResponse> {
    const messages: OpenAIMessage[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content: prompt });

    const request: OpenAICompletionRequest = {
      model: this.config.model,
      messages,
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens,
      response_format: { type: 'json_object' }
    };

    const response = await this.apiClient.createChatCompletion(request);

    if (!response.choices || response.choices.length === 0) {
      throw new Error('No response choices returned from OpenAI API');
    }

    const choice = response.choices[0];

    return {
      content: this.extractTextContent(choice.message.content),
      finishReason: choice.finish_reason || 'stop',
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens
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

    const messages: OpenAIMessage[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    // Create message content with text and images
    const messageContent: OpenAIMessageContent[] = [
      { type: 'text', text: prompt }
    ];

    // Add images as base64 data URLs
    const base64Images = OpenAIModelUtils.convertImagesToBase64(images);
    for (const imageUrl of base64Images) {
      messageContent.push({
        type: 'image_url',
        image_url: {
          url: imageUrl,
          detail: 'high'
        }
      });
    }

    messages.push({
      role: 'user',
      content: messageContent
    });

    const request: OpenAICompletionRequest = {
      model: this.config.model,
      messages,
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens
    };

    const response = await this.apiClient.createChatCompletion(request);

    if (!response.choices || response.choices.length === 0) {
      throw new Error('No response choices returned from OpenAI API');
    }

    const choice = response.choices[0];

    return {
      content: this.extractTextContent(choice.message.content),
      finishReason: choice.finish_reason || 'stop',
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens
      } : undefined
    };
  }

  async generateFromMessages(messages: AIMessage[]): Promise<AIResponse> {
    const openaiMessages: OpenAIMessage[] = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const request: OpenAICompletionRequest = {
      model: this.config.model,
      messages: openaiMessages,
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens
    };

    const response = await this.apiClient.createChatCompletion(request);

    if (!response.choices || response.choices.length === 0) {
      throw new Error('No response choices returned from OpenAI API');
    }

    const choice = response.choices[0];

    return {
      content: this.extractTextContent(choice.message.content),
      finishReason: choice.finish_reason || 'stop',
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens
      } : undefined
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      return await this.apiClient.healthCheck();
    } catch (error) {
      console.error('OpenAI health check failed:', error);
      return false;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await this.apiClient.getModels();
      return response.data
        .filter(model => model.id.startsWith('gpt-'))
        .map(model => model.id)
        .sort();
    } catch (error) {
      console.error('Failed to fetch OpenAI models:', error);
      return ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo']; // Fallback models
    }
  }

  /**
   * Build request options from configuration
   */
  private buildRequestOptions(): Partial<OpenAICompletionRequest> {
    const options: Partial<OpenAICompletionRequest> = {};

    if (this.config.temperature !== undefined) {
      options.temperature = this.config.temperature;
    }

    if (this.config.maxTokens !== undefined) {
      options.max_tokens = this.config.maxTokens;
    }

    return options;
  }

  /**
   * Extract text content from OpenAI message content
   */
  private extractTextContent(content: string | OpenAIMessageContent[]): string {
    if (typeof content === 'string') {
      return content;
    }
    return content.map(c => c.text || '').join('');
  }
}
