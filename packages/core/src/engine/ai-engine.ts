import * as path from 'path';
import { PromptTemplate } from '../prompt-template';
import { OllamaProvider, OpenAIProvider } from '../providers';
import { PageState } from '../types';
import { AILogConfig, AILoggingService } from '../utils/logging';
import { ActionStep, ActionType } from './planning/types/types';

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


/**
 * AI Configuration for providers
 */
export interface AIConfig {
  model: string;
  provider?: string;
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
  private aiLogger: AILoggingService;

  constructor() {
    // Initialize with available providers
    this.promptTemplate = new PromptTemplate();

    // Initialize AI logging service
    const aiLogConfig: AILogConfig = {
      logDir: path.resolve(__dirname, '../../../ai-debug-logs'),
      enableFileSystemLogging: process.env.AI_ENABLE_FILE_LOGGING === 'true' // Disabled by default, enable via env var
    };
    this.aiLogger = new AILoggingService(aiLogConfig);
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
      case 'openai':
        return new OpenAIProvider(config);
      default:
        throw new Error(`Unsupported AI provider: ${providerName}. Supported providers: 'ollama', 'openai'.`);
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
    const provider = this.getDefaultProvider();

    // Log the request
    this.aiLogger.logRequest('generateText', prompt, systemPrompt, provider.name);

    const response = await provider.generateText(prompt, systemPrompt);

    // Log the response
    this.aiLogger.logResponse('generateText', response, provider.name, prompt);

    return response;
  }

  /**
   * Generate structured JSON response using the best available method
   */
  async generateStructuredJSON(prompt: string, systemPrompt?: string): Promise<AIResponse> {
    const provider = this.getDefaultProvider();

    // Log the request
    this.aiLogger.logRequest('generateStructuredJSON', prompt, systemPrompt, provider.name);

    let response: AIResponse;

    // Use provider's structured JSON method if available
    if (provider.generateStructuredJSON) {
      response = await provider.generateStructuredJSON(prompt, systemPrompt);
    } else {
      // Fallback to regular text generation with enhanced prompting
      const structuredJsonPrompt = this.promptTemplate.render('structured-json', {});
      const enhancedSystemPrompt = systemPrompt
        ? `${systemPrompt}\n\n${structuredJsonPrompt}`
        : structuredJsonPrompt;

      response = await this.generateText(prompt, enhancedSystemPrompt);
    }

    // Log the response
    this.aiLogger.logResponse('generateStructuredJSON', response, provider.name, prompt);

    return response;
  }

  /**
   * Generate with vision using the default provider (if supported)
   */
  async generateWithVision(prompt: string, images: Buffer[], systemPrompt?: string): Promise<AIResponse> {
    const provider = this.getDefaultProvider();
    if (!provider.generateWithVision) {
      throw new Error(`Provider '${provider.name}' does not support vision capabilities`);
    }

    // Log the request (with image info but not the actual image data)
    this.aiLogger.logVisionRequest('generateWithVision', prompt, systemPrompt, provider.name, images);

    const response = await provider.generateWithVision(prompt, images, systemPrompt);

    // Log the response
    this.aiLogger.logResponse('generateWithVision', response, provider.name, prompt);

    return response;
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

    const prompt = this.promptTemplate.render('instruction-to-steps-simple', {
      instruction: instruction
    });

    try {
      const response = await this.generateText(prompt, systemPrompt);

      // Parse the JSON response
      const cleanedResponse = response.content.trim();

      // Use a more secure regex to prevent ReDoS attacks
      // Find the first '[' and the last matching ']' to extract JSON array
      const firstBracket = cleanedResponse.indexOf('[');
      const lastBracket = cleanedResponse.lastIndexOf(']');

      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        const jsonString = cleanedResponse.substring(firstBracket, lastBracket + 1);
        return JSON.parse(jsonString);
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
      const prompt = query || this.promptTemplate.render('page-analysis-default', {});
      const response = await provider.generateWithVision(prompt, [pageState.screenshot]);
      return response.content;
    } else {
      // Text-only analysis
      const prompt = this.promptTemplate.render('page-analysis-text-only', {
        url: pageState.url,
        title: pageState.title,
        contentPreview: pageState.content?.substring(0, 2000) || 'No content available',
        query: query || this.promptTemplate.render('page-analysis-fallback', {})
      });

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

  /**
   * Get AI logging service for external access if needed
   */
  getAILogger(): AILoggingService {
    return this.aiLogger;
  }
}
