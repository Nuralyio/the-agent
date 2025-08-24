/**
 * Browser-related type definitions
 */

import type { BrowserInstance, BrowserType, LaunchOptions, PageInstance, ScreenshotOptions } from '../adapters/interfaces';

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

export type BrowserRequirements = {
  browserType: BrowserType;
  crossBrowser?: boolean;
  performance?: 'fast' | 'balanced' | 'thorough';
  features?: string[];
};

export interface BrowserManager {
  getCurrentPage(): Promise<PageInstance | null>;
  launchBrowser(options?: LaunchOptions): Promise<BrowserInstance>;
  closeBrowser(): Promise<void>;
  isReady(): boolean;
  createPage(url?: string): Promise<PageInstance>;
  takeScreenshot(options?: ScreenshotOptions): Promise<Buffer>;
}
