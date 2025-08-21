/**
 * AI-specific logging types
 */

export interface AIRequestLogEntry {
  timestamp: string;
  method: string;
  providerName: string;
  promptLength: number;
  systemPromptLength: number;
  prompt: string;
  systemPrompt: string | null;
}

export interface AIResponseLogEntry {
  timestamp: string;
  method: string;
  providerName: string;
  responseContentLength: number;
  finishReason: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } | null;
  originalPromptLength: number;
  content: string;
}

export interface AIVisionRequestLogEntry extends AIRequestLogEntry {
  imageCount: number;
  imageSizes: number[];
  totalImageDataSize: number;
}

export interface AILogConfig {
  logDir: string;
  enableFileSystemLogging?: boolean; // File system logging disabled by default
}

export type AILogMethod = 'generateText' | 'generateStructuredJSON' | 'generateWithVision';
