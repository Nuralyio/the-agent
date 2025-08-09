// AI provider and configuration types

export interface AIConfig {
  provider: 'ollama';
  model: string;
  apiKey?: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIProvider {
  name: string;
  isAvailable(): Promise<boolean>;
  generatePlan(instruction: string, context?: any): Promise<any>;
  generateResponse(prompt: string, context?: any): Promise<string>;
  configure(config: AIConfig): void;
}

export interface AIPromptContext {
  currentUrl?: string;
  currentTitle?: string;
  availableElements?: any[];
  previousActions?: any[];
  sessionHistory?: any[];
}

export interface AIResponse {
  content: string;
  confidence: number;
  reasoning?: string;
  suggestions?: string[];
}
