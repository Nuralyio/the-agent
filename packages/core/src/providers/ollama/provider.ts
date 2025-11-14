import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatOllama } from '@langchain/ollama';
import { AIConfig, AIMessage, AIProvider, AIResponse, VisionCapabilities } from '../../engine/ai-engine';
import { BrowserActionSchema } from '../shared/schemas/browser-action.schema';
import { buildMessages, convertToLangChainMessages } from '../shared/utils/message-utils';
import { formatAIResponse } from '../shared/utils/response-utils';
import { StructuredOutputUtil, createStructuredOutputUtil } from '../shared/utils/structured-output.util';
import { OllamaModelsResponse } from './types';
import { OllamaModelUtils } from './utils';

/**
 * Ollama AI Provider - Local AI models using @langchain/ollama
 * Refactored to use the official LangChain Ollama integration
 */
export class OllamaProvider implements AIProvider {
  readonly name = 'ollama';
  readonly config: AIConfig;
  readonly visionCapabilities: VisionCapabilities;

  model: ChatOllama;
  private structuredOutputUtil: StructuredOutputUtil;

  constructor(config: AIConfig) {
    this.config = {
      baseUrl: 'http://localhost:11434',
      temperature: 0.7,
      maxTokens: 2048,
      timeout: 30000,
      ...config,
      model: config.model || 'llama2'
    };

    // Initialize ChatOllama model
    this.model = new ChatOllama({
      model: this.config.model,
      baseUrl: this.config.baseUrl,
      temperature: this.config.temperature,
      numPredict: this.config.maxTokens
    });

    // Initialize structured output utility with browser action schema
    this.structuredOutputUtil = createStructuredOutputUtil(BrowserActionSchema);

    // Set vision capabilities based on model
    this.visionCapabilities = OllamaModelUtils.getVisionCapabilities(this.config.model);
  }

  async generateText(prompt: string, systemPrompt?: string): Promise<AIResponse> {
    const messages = buildMessages(prompt, systemPrompt);
    const response = await this.model.invoke(messages);
    return formatAIResponse(response);
  }

  async generateWithVision(prompt: string, images: Buffer[], systemPrompt?: string): Promise<AIResponse> {
    if (!this.visionCapabilities.supportsImages) {
      throw new Error(`Model ${this.config.model} does not support vision capabilities`);
    }

    const messages: (SystemMessage | HumanMessage)[] = [];

    if (systemPrompt) {
      messages.push(new SystemMessage(systemPrompt));
    }

    // Convert images to base64 for Ollama
    const base64Images = OllamaModelUtils.convertImagesToBase64(images);

    messages.push(new HumanMessage({
      content: [
        { type: 'text', text: prompt },
        ...base64Images.map(img => ({ type: 'image_url' as const, image_url: img }))
      ]
    }));

    const response = await this.model.invoke(messages);
    return formatAIResponse(response);
  }

  async generateFromMessages(messages: AIMessage[]): Promise<AIResponse> {
    const langchainMessages = convertToLangChainMessages(messages);
    const response = await this.model.invoke(langchainMessages);
    return formatAIResponse(response);
  }

  async generateStructuredJSON(prompt: string, systemPrompt?: string): Promise<AIResponse> {
    try {
      return await this.structuredOutputUtil.generateStructuredJSON(this, prompt, systemPrompt);
    } catch {
      // Fallback to enhanced text generation
      return this.generateTextWithJsonFallback(prompt, systemPrompt);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Try to invoke the model with a simple message
      await this.model.invoke([new HumanMessage('test')]);
      return true;
    } catch (err) {
      console.error('Ollama health check failed:', err);
      return false;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(this.config.timeout || 30000)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: OllamaModelsResponse = await response.json();
      return data.models.map(model => model.name);
    } catch (error) {
      console.warn('Failed to fetch models from Ollama API:', error);
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

    try {
      const response = await fetch(`${this.config.baseUrl}/api/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: modelName }),
        signal: AbortSignal.timeout(300000) // 5 minutes for model pulling
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // The pull endpoint returns streaming responses, but for simplicity we just wait for completion
      // In a production environment, you might want to handle the streaming response for progress updates
    } catch (error) {
      throw new Error(`Failed to pull model ${modelName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if a specific model is available
   */
  async isModelAvailable(modelName: string): Promise<boolean> {
    const models = await this.getAvailableModels();
    return OllamaModelUtils.isModelAvailable(modelName, models);
  }

  private async generateTextWithJsonFallback(prompt: string, systemPrompt?: string): Promise<AIResponse> {
    const enhancedSystemPrompt = systemPrompt
      ? `${systemPrompt}\n\nCRITICAL: You MUST respond with ONLY valid JSON. No markdown formatting, no code blocks, no comments, no explanations. Only raw JSON that can be parsed directly.`
      : 'CRITICAL: You MUST respond with ONLY valid JSON. No markdown formatting, no code blocks, no comments, no explanations. Only raw JSON that can be parsed directly.';

    const enhancedPrompt = `${prompt}\n\nRemember: Respond with ONLY valid JSON. Example format: {"action": "click", "selector": "#button", "reasoning": "Need to click the submit button"}`;

    return this.generateText(enhancedPrompt, enhancedSystemPrompt);
  }
}
