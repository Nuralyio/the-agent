import { AIConfig } from '../../types/config.types';

/**
 * AI Provider interface
 */
export interface AIProvider {
  name: string;
  isAvailable(): Promise<boolean>;
  generateCompletion(prompt: string, options?: any): Promise<string>;
  configure(config: AIConfig): void;
}

/**
 * Provider configuration interface
 */
export interface ProviderConfig {
  baseUrl?: string;
  model?: string;
  apiKey?: string;
  timeout?: number;
  [key: string]: any;
}
