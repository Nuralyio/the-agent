import * as fs from 'fs';
import * as path from 'path';
import { PromptTemplate } from '../prompt-template';
import { OllamaProvider, OpenAIProvider } from '../providers';
import { PageState } from '../types';
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
    this.logAIRequest('generateText', prompt, systemPrompt, provider.name);

    const response = await provider.generateText(prompt, systemPrompt);

    // Log the response
    this.logAIResponse('generateText', response, provider.name, prompt);

    return response;
  }

  /**
   * Generate structured JSON response using the best available method
   */
  async generateStructuredJSON(prompt: string, systemPrompt?: string): Promise<AIResponse> {
    const provider = this.getDefaultProvider();

    // Log the request
    this.logAIRequest('generateStructuredJSON', prompt, systemPrompt, provider.name);

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
    this.logAIResponse('generateStructuredJSON', response, provider.name, prompt);

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
    this.logAIVisionRequest('generateWithVision', prompt, systemPrompt, provider.name, images);

    const response = await provider.generateWithVision(prompt, images, systemPrompt);

    // Log the response
    this.logAIResponse('generateWithVision', response, provider.name, prompt);

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
   * Log AI request (prompt + system prompt)
   */
  private logAIRequest(method: string, prompt: string, systemPrompt: string | undefined, providerName: string): void {
    try {
      const timestamp = new Date().toISOString();
      const requestData = {
        timestamp,
        method,
        providerName,
        promptLength: prompt.length,
        systemPromptLength: systemPrompt?.length || 0,
        prompt: prompt,
        systemPrompt: systemPrompt || null
      };

      // Create request log file
      const sanitizedMethod = method.replace(/[^a-zA-Z0-9-]/g, '-');
      const logFileName = `${sanitizedMethod}-REQUEST-${timestamp.split('T')[0]}-${timestamp.split('T')[1].split('.')[0].replace(/:/g, '-')}.log`;
      const logFilePath = this.getLogFilePath(logFileName);

      // Format request log entry
      const logEntry = `${JSON.stringify(requestData, null, 2)}\n\n--- AI REQUEST PROMPT ---\n${prompt}\n\n${systemPrompt ? `--- SYSTEM PROMPT ---\n${systemPrompt}\n\n` : ''}${'='.repeat(80)}\n\n`;

      // Write to file
      fs.writeFileSync(logFilePath, logEntry);

      if (process.env.NODE_ENV === 'development' || process.env.AI_DEBUG === 'true') {
        console.log(`🤖 Logged AI request for '${method}' to: ${logFileName}`);
      }
    } catch (error) {
      console.warn(`Failed to log AI request: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Log AI response
   */
  private logAIResponse(method: string, response: AIResponse, providerName: string, originalPrompt: string): void {
    try {
      const timestamp = new Date().toISOString();
      const responseData = {
        timestamp,
        method,
        providerName,
        responseContentLength: response.content?.length || 0,
        finishReason: response.finishReason || 'unknown',
        usage: response.usage || null,
        originalPromptLength: originalPrompt.length
      };

      // Create response log file
      const sanitizedMethod = method.replace(/[^a-zA-Z0-9-]/g, '-');
      const logFileName = `${sanitizedMethod}-RESPONSE-${timestamp.split('T')[0]}-${timestamp.split('T')[1].split('.')[0].replace(/:/g, '-')}.log`;
      const logFilePath = this.getLogFilePath(logFileName);

      // Format response log entry
      const logEntry = `${JSON.stringify(responseData, null, 2)}\n\n--- AI RESPONSE ---\n${response.content || 'No content'}\n\n${'='.repeat(80)}\n\n`;

      // Write to file
      fs.writeFileSync(logFilePath, logEntry);

      if (process.env.NODE_ENV === 'development' || process.env.AI_DEBUG === 'true') {
        console.log(`🤖 Logged AI response for '${method}' to: ${logFileName}`);
      }
    } catch (error) {
      console.warn(`Failed to log AI response: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Log AI vision request (prompt + system prompt + image info)
   */
  private logAIVisionRequest(method: string, prompt: string, systemPrompt: string | undefined, providerName: string, images: Buffer[]): void {
    try {
      const timestamp = new Date().toISOString();
      const requestData = {
        timestamp,
        method,
        providerName,
        promptLength: prompt.length,
        systemPromptLength: systemPrompt?.length || 0,
        imageCount: images.length,
        imageSizes: images.map(img => img.length),
        totalImageDataSize: images.reduce((total, img) => total + img.length, 0),
        prompt: prompt,
        systemPrompt: systemPrompt || null
      };

      // Create request log file
      const sanitizedMethod = method.replace(/[^a-zA-Z0-9-]/g, '-');
      const logFileName = `${sanitizedMethod}-REQUEST-${timestamp.split('T')[0]}-${timestamp.split('T')[1].split('.')[0].replace(/:/g, '-')}.log`;
      const logFilePath = this.getLogFilePath(logFileName);

      // Format request log entry (without actual image data)
      const logEntry = `${JSON.stringify(requestData, null, 2)}\n\n--- AI VISION REQUEST PROMPT ---\n${prompt}\n\n${systemPrompt ? `--- SYSTEM PROMPT ---\n${systemPrompt}\n\n` : ''}--- IMAGE INFO ---\nImages: ${images.length}\nTotal size: ${requestData.totalImageDataSize} bytes\n\n${'='.repeat(80)}\n\n`;

      // Write to file
      fs.writeFileSync(logFilePath, logEntry);

      if (process.env.NODE_ENV === 'development' || process.env.AI_DEBUG === 'true') {
        console.log(`🤖 Logged AI vision request for '${method}' to: ${logFileName}`);
      }
    } catch (error) {
      console.warn(`Failed to log AI vision request: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get log file path
   */
  private getLogFilePath(fileName: string): string {
    // Use ai-debug-logs directory in packages root
    const logsDir = path.resolve(__dirname, '../../../ai-debug-logs');

    // Ensure directory exists
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    return path.join(logsDir, fileName);
  }
}
