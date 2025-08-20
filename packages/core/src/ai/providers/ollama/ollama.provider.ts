import { AIConfig, AIMessage, AIProvider, AIResponse, VisionCapabilities } from '../../../engine/ai-engine';
import { PromptTemplate } from '../../../prompt-template';
import { OllamaApiClient } from '../../../providers/ollama/api-client';
import { OllamaModelUtils } from '../../../providers/ollama/model-utils';
import {
  OllamaChatMessage,
  OllamaChatRequest,
  OllamaGenerateRequest
} from '../../../providers/ollama/types';
import { BrowserActionSchema } from '../../../providers/shared/schemas/browser-action.schema';
import { StructuredOutputUtil, createStructuredOutputUtil } from '../../../providers/shared/utils/structured-output.util';

/**
 * Ollama AI Provider - Local AI models
 * Refactored to focus only on provider functionality
 */
export class OllamaProvider implements AIProvider {
  readonly name = 'ollama';
  readonly config: AIConfig;
  readonly visionCapabilities: VisionCapabilities;

  private apiClient: OllamaApiClient;
  private structuredOutputUtil: StructuredOutputUtil;
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

    // Initialize API client
    this.apiClient = new OllamaApiClient(
      this.config.baseUrl!,
      this.config.timeout
    );

    // Initialize prompt template
    this.promptTemplate = new PromptTemplate();

    // Initialize structured output utility with browser action schema
    this.structuredOutputUtil = createStructuredOutputUtil(BrowserActionSchema);    // Set vision capabilities based on model
    this.visionCapabilities = OllamaModelUtils.getVisionCapabilities(this.config.model);
  }

  async generateText(prompt: string, systemPrompt?: string): Promise<AIResponse> {
    const request: OllamaGenerateRequest = {
      model: this.config.model,
      prompt,
      stream: false,
      ...(systemPrompt && { system: systemPrompt }),
      ...(this.hasRequestOptions() && { options: this.buildRequestOptions() })
    };

    const response = await this.apiClient.generate(request);

    return {
      content: response.response,
      finishReason: response.done ? 'stop' : 'length',
      usage: {
        promptTokens: response.prompt_eval_count || 0,
        completionTokens: response.eval_count || 0,
        totalTokens: (response.prompt_eval_count || 0) + (response.eval_count || 0)
      }
    };
  }

  async generateWithVision(prompt: string, images: Buffer[], systemPrompt?: string): Promise<AIResponse> {
    if (!this.visionCapabilities.supportsImages) {
      throw new Error(`Model ${this.config.model} does not support vision capabilities`);
    }

    const messages: OllamaChatMessage[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({
      role: 'user',
      content: prompt,
      images: OllamaModelUtils.convertImagesToBase64(images)
    });

    const request: OllamaChatRequest = {
      model: this.config.model,
      messages,
      stream: false,
      ...(this.hasRequestOptions() && { options: this.buildRequestOptions() })
    };

    const response = await this.apiClient.chat(request);

    return {
      content: response.message.content,
      finishReason: response.done ? 'stop' : 'length'
    };
  }

  async generateFromMessages(messages: AIMessage[]): Promise<AIResponse> {
    const ollamaMessages: OllamaChatMessage[] = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const request: OllamaChatRequest = {
      model: this.config.model,
      messages: ollamaMessages,
      stream: false,
      ...(this.hasRequestOptions() && { options: this.buildRequestOptions() })
    };

    const response = await this.apiClient.chat(request);

    return {
      content: response.message.content,
      finishReason: response.done ? 'stop' : 'length'
    };
  }

  async generateStructuredJSON(prompt: string, systemPrompt?: string): Promise<AIResponse> {
    try {
      return await this.structuredOutputUtil.generateStructuredJSON(this, prompt, systemPrompt);
    } catch (error) {
      // Fallback to enhanced text generation
      return this.generateTextWithJsonFallback(prompt, systemPrompt);
    }
  }

  async healthCheck(): Promise<boolean> {
    return this.apiClient.healthCheck();
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await this.apiClient.getModels();
      return response.models?.map(model => model.name) || [];
    } catch (error) {
      console.error('Failed to fetch Ollama models:', error);
      return [];
    }
  }

  /**
   * Pull a model from Ollama registry
   */
  async pullModel(modelName: string): Promise<void> {
    if (!OllamaModelUtils.isValidModelName(modelName)) {
      throw new Error(`Invalid model name: ${modelName}`);
    }

    await this.apiClient.pullModel(modelName);
  }

  /**
   * Check if a specific model is available
   */
  async isModelAvailable(modelName: string): Promise<boolean> {
    const models = await this.getAvailableModels();
    return OllamaModelUtils.isModelAvailable(modelName, models);
  }

  /**
   * Private helper methods
   */

  private hasRequestOptions(): boolean {
    return this.config.temperature !== undefined || this.config.maxTokens !== undefined;
  }

  private buildRequestOptions() {
    const options: any = {};
    if (this.config.temperature !== undefined) {
      options.temperature = this.config.temperature;
    }
    if (this.config.maxTokens !== undefined) {
      options.num_predict = this.config.maxTokens;
    }
    return options;
  }

  private async generateTextWithJsonFallback(prompt: string, systemPrompt?: string): Promise<AIResponse> {
    const jsonFallbackPrompt = this.promptTemplate.render('json-generation-fallback', {});

    const enhancedSystemPrompt = systemPrompt
      ? `${systemPrompt}\n\n${jsonFallbackPrompt}`
      : jsonFallbackPrompt;

    return this.generateText(prompt, enhancedSystemPrompt);
  }
}
