import { LaunchOptions, BrowserType } from '../types';
import { PageInstance } from '../types';

/**
 * Browser instance interface
 */
export interface BrowserInstance {
  id: string;
  version(): string;
  isConnected(): boolean;
  createPage(url?: string): Promise<PageInstance>;
  close(): Promise<void>;
}

/**
 * Browser adapter interface
 */
export interface BrowserAdapter {
  name: string;
  version: string;
  isAvailable(): Promise<boolean>;
  launch(options?: LaunchOptions): Promise<BrowserInstance>;
  getDefaultOptions(): LaunchOptions;
  getSupportedBrowserTypes(): BrowserType[];
}

/**
 * Re-export PageInstance from types
 */
export { PageInstance } from '../types';
