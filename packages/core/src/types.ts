/**
 * Main types export file
 */

// Re-export all adapter types
export * from './adapters/types';

// Re-export all engine types  
export * from './engine/types';

// Import for local use
import { ScreenshotOptions } from './adapters/types';

// Import needed types for local use
import { ActionStep, TaskContext } from './engine/types';
import { LaunchOptions, BrowserType, BrowserInstance, PageInstance } from './adapters/types';

// Additional core types
export interface BrowserConfig {
  adapter: string;
  launchOptions?: LaunchOptions;
  timeout?: number;
  retries?: number;
  browserType?: BrowserType;
  headless?: boolean;
  viewport?: { width: number; height: number };
  userAgent?: string;
  locale?: string;
  timezone?: string;
  proxy?: string;
  fallbackAdapters?: string[];
}

export interface BrowserRequirements {
  browserType: BrowserType;
  crossBrowser?: boolean;
  performance?: 'fast' | 'balanced' | 'thorough';
  features?: string[];
}

export interface BrowserManager {
  getCurrentPage(): Promise<PageInstance | null>;
  launchBrowser(options?: LaunchOptions): Promise<BrowserInstance>;
  closeBrowser(): Promise<void>;
  isReady(): boolean;
  createPage(url?: string): Promise<PageInstance>;
  takeScreenshot(options?: ScreenshotOptions): Promise<Buffer>;
}

export interface AIConfig {
  provider: string;
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ExecutionOptions {
  timeout?: number;
  retries?: number;
  screenshot?: boolean;
  headless?: boolean;
  slowMo?: number;
}

export interface TaskResult {
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
  screenshots?: Buffer[];
  steps: ActionStep[];
  extractedData?: any;
}

// Re-export specific types for convenience
export { ActionStep, ActionPlan, ActionType, PageState, TaskContext } from './engine/types';
export { BrowserAdapter, BrowserInstance, PageInstance, ElementHandle, BrowserType, LaunchOptions } from './adapters/types';

// Additional exports
export interface ActionEngine {
  executeTask(objective: string, context?: TaskContext): Promise<TaskResult>;
}
