import { PageState } from '../types';
import { ActionStep, ActionType } from '../engine/types';
import { PromptTemplate } from '../prompt-template';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  finishReason?: 'stop' | 'length' | 'tool_calls' | 'content_filter';
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

import { OllamaProvider } from './providers';

/**
 * AI Configuration for providers
 */
export interface AIConfig {
  model: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

export interface VisionCapabilities {
  supportsImages: boolean;
  supportedFormats: string[];
  maxImageSize?: number;
}

/**
 * Generic AI Provider interface for different AI services
 */
export interface AIProvider {
  readonly name: string;
  readonly config: AIConfig;
  readonly visionCapabilities: VisionCapabilities;

  /**
   * Send a text-only prompt to the AI
   */
  generateText(prompt: string, systemPrompt?: string): Promise<AIResponse>;

  /**
   * Generate structured JSON response (optional - for providers that support it)
   */
  generateStructuredJSON?(prompt: string, systemPrompt?: string): Promise<AIResponse>;

  /**
   * Send a multi-modal prompt (text + images) to the AI
   */
  generateWithVision?(prompt: string, images: Buffer[], systemPrompt?: string): Promise<AIResponse>;

  /**
   * Send a conversation with multiple messages
   */
  generateFromMessages(messages: AIMessage[]): Promise<AIResponse>;

  /**
   * Test if the provider is available/healthy
   */
  healthCheck(): Promise<boolean>;

  /**
   * Get available models for this provider
   */
  getAvailableModels?(): Promise<string[]>;
}

/**
 * AI Engine that manages multiple providers and provides a unified interface
 */
export class AIEngine {
  private providers: Map<string, AIProvider> = new Map();
  private defaultProvider?: AIProvider;
  private promptTemplate: PromptTemplate;

  constructor() {
    // Initialize with available providers
    this.promptTemplate = new PromptTemplate();
  }

  /**
   * Register an AI provider
   */
  registerProvider(provider: AIProvider): void {
    this.providers.set(provider.name, provider);

    // Set as default if none exists
    if (!this.defaultProvider) {
      this.defaultProvider = provider;
    }
  }

  /**
   * Add a provider to the engine by name and configuration
   */
  addProvider(providerName: string, config: AIConfig): void {
    const provider = this.createProvider(providerName, config);
    this.registerProvider(provider);
  }

  /**
   * Creates a provider instance based on the provider name
   */
  private createProvider(providerName: string, config: AIConfig): AIProvider {
    switch (providerName.toLowerCase()) {
      case 'ollama':
        return new OllamaProvider(config);
      default:
        throw new Error(`Unsupported AI provider: ${providerName}. Only 'ollama' is supported.`);
    }
  }

  /**
   * Set the default provider
   */
  setDefaultProvider(providerName: string): void {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider '${providerName}' not found`);
    }
    this.defaultProvider = provider;
  }

  /**
   * Get a specific provider
   */
  getProvider(providerName: string): AIProvider | undefined {
    return this.providers.get(providerName);
  }

  /**
   * Get the default provider
   */
  getDefaultProvider(): AIProvider {
    if (!this.defaultProvider) {
      throw new Error('No default AI provider configured');
    }
    return this.defaultProvider;
  }

  /**
   * Generate text using the default provider
   */
  async generateText(prompt: string, systemPrompt?: string): Promise<AIResponse> {
    return this.getDefaultProvider().generateText(prompt, systemPrompt);
  }

  /**
   * Generate structured JSON response using the best available method
   */
  async generateStructuredJSON(prompt: string, systemPrompt?: string): Promise<AIResponse> {
    const provider = this.getDefaultProvider();

    // Use provider's structured JSON method if available
    if (provider.generateStructuredJSON) {
      return provider.generateStructuredJSON(prompt, systemPrompt);
    }

    // Fallback to regular text generation with enhanced prompting
    const structuredJsonPrompt = this.promptTemplate.render('structured-json', {});
    const enhancedSystemPrompt = systemPrompt
      ? `${systemPrompt}\n\n${structuredJsonPrompt}`
      : structuredJsonPrompt;

    return this.generateText(prompt, enhancedSystemPrompt);
  }

  /**
   * Generate with vision using the default provider (if supported)
   */
  async generateWithVision(prompt: string, images: Buffer[], systemPrompt?: string): Promise<AIResponse> {
    const provider = this.getDefaultProvider();
    if (!provider.generateWithVision) {
      throw new Error(`Provider '${provider.name}' does not support vision capabilities`);
    }
    return provider.generateWithVision(prompt, images, systemPrompt);
  }

  /**
   * Parse instruction into browser automation steps using AI
   */
  async parseInstructionToSteps(instruction: string, pageState: PageState): Promise<ActionStep[]> {
    const systemPrompt = this.promptTemplate.render('instruction-parsing', {
      pageUrl: pageState.url,
      pageTitle: pageState.title,
      viewportWidth: pageState.viewport?.width || 1280,
      viewportHeight: pageState.viewport?.height || 720
    });

    const prompt = `Convert this instruction into browser automation steps: "${instruction}"

Return only the JSON array, no additional text.`;

    try {
      const response = await this.generateText(prompt, systemPrompt);

      // Parse the JSON response
      const cleanedResponse = response.content.trim();
      const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        console.warn('Failed to parse AI response as JSON, falling back to simple parsing');
        return this.fallbackParsing(instruction);
      }
    } catch (error) {
      console.error('AI parsing failed:', error);
      return this.fallbackParsing(instruction);
    }
  }

  /**
   * Fallback parsing when AI fails
   */
  private fallbackParsing(instruction: string): ActionStep[] {
    const steps: ActionStep[] = [];
    const lowerInstruction = instruction.toLowerCase();

    if (lowerInstruction.includes('screenshot') || lowerInstruction.includes('capture')) {
      steps.push({
        id: 'fallback-screenshot',
        type: ActionType.SCREENSHOT,
        description: 'Take screenshot'
      });
    } else {
      steps.push({
        id: 'fallback-extract',
        type: ActionType.EXTRACT,
        description: `Process instruction: ${instruction}`
      });
    }

    return steps;
  }

  /**
   * Analyze page content using AI (with vision if available)
   */
  async analyzePageContent(pageState: PageState, query?: string): Promise<string> {
    const provider = this.getDefaultProvider();

    if (provider.visionCapabilities.supportsImages && provider.generateWithVision && pageState.screenshot) {
      const prompt = query || 'Analyze this webpage and describe what you see. Focus on interactive elements, forms, buttons, and navigation.';
      const response = await provider.generateWithVision(prompt, [pageState.screenshot]);
      return response.content;
    } else {
      // Text-only analysis
      const prompt = `Analyze this webpage content and describe the key elements:

URL: ${pageState.url}
Title: ${pageState.title}
Content Preview: ${pageState.content?.substring(0, 2000) || 'No content available'}...

${query || 'Describe the key interactive elements, forms, buttons, and navigation options available on this page.'}`;

      const response = await this.generateText(prompt);
      return response.content;
    }
  }

  /**
   * List all registered providers
   */
  listProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Health check all providers
   */
  async checkAllProviders(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    for (const [name, provider] of this.providers) {
      try {
        results[name] = await provider.healthCheck();
      } catch {
        results[name] = false;
      }
    }

    return results;
  }
}
