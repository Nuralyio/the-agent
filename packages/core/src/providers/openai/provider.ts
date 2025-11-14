import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { AIConfig, AIMessage, AIProvider, AIResponse, VisionCapabilities } from '../../engine/ai-engine';
import { BrowserActionSchema } from '../shared/schemas/browser-action.schema';
import { buildMessages, convertToLangChainMessages } from '../shared/utils/message-utils';
import { formatAIResponse } from '../shared/utils/response-utils';
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

  model: ChatOpenAI;
  structuredOutputUtil: StructuredOutputUtil;

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

  async generateText(prompt: string, systemPrompt?: string, callbacks?: any[]): Promise<AIResponse> {
    const messages = buildMessages(prompt, systemPrompt);
    const config = callbacks && callbacks.length > 0 ? { callbacks } : undefined;
    const response = await this.model.invoke(messages, config);
    return formatAIResponse(response);
  }

  async generateStructuredJSON(prompt: string, systemPrompt?: string, callbacks?: any[]): Promise<AIResponse> {
    const messages = buildMessages(prompt, systemPrompt);

    // Use structured output with JSON mode
    const modelWithJsonMode = this.model.bind({
      response_format: { type: 'json_object' }
    });

    const config = callbacks && callbacks.length > 0 ? { callbacks } : undefined;
    const response = await modelWithJsonMode.invoke(messages, config);
    return formatAIResponse(response);
  }

  async generateWithVision(prompt: string, images: Buffer[], systemPrompt?: string, callbacks?: any[]): Promise<AIResponse> {
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

    const messages: (SystemMessage | HumanMessage)[] = [];

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

    const config = callbacks && callbacks.length > 0 ? { callbacks } : undefined;
    const response = await this.model.invoke(messages, config);
    return formatAIResponse(response);
  }

  async generateFromMessages(messages: AIMessage[], callbacks?: any[]): Promise<AIResponse> {
    const langchainMessages = convertToLangChainMessages(messages);
    const config = callbacks && callbacks.length > 0 ? { callbacks } : undefined;
    const response = await this.model.invoke(langchainMessages, config);
    return formatAIResponse(response);
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.model.invoke([new HumanMessage('test')]);
      return true;
    } catch (err) {
      console.error('OpenAI health check failed:', err);
      return false;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    // ChatOpenAI doesn't provide a direct method to list models
    // Return common GPT models as fallback
    return ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];
  }
}
