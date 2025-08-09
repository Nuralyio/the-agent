// Browser-related type definitions
import { PageInstance } from './actions';

export enum BrowserType {
  CHROMIUM = 'chromium',
  FIREFOX = 'firefox',
  WEBKIT = 'webkit',
  CHROME = 'chrome',
  EDGE = 'edge'
}

export interface LaunchOptions {
  headless?: boolean;
  viewport?: { width: number; height: number };
  userAgent?: string;
  locale?: string;
  timezone?: string;
  proxy?: ProxyConfig;
  args?: string[];
  executablePath?: string;
}

export interface ProxyConfig {
  server: string;
  username?: string;
  password?: string;
  bypass?: string[];
}

export interface BrowserConfig {
  adapter: string;
  browserType: BrowserType;
  headless: boolean;
  viewport: { width: number; height: number };
  userAgent?: string;
  locale?: string;
  timezone?: string;
  proxy?: ProxyConfig;
  extensions?: string[];
  fallbackAdapters?: string[];
}

export interface BrowserRequirements {
  browserType: BrowserType;
  features: string[];
  crossBrowser: boolean;
  performance: 'fast' | 'balanced' | 'robust';
}

// Browser adapter interfaces
export interface BrowserAdapter {
  name: string;
  version: string;
  isAvailable(): Promise<boolean>;
  launch(options?: LaunchOptions): Promise<BrowserInstance>;
  getDefaultOptions(): LaunchOptions;
  getSupportedBrowserTypes(): BrowserType[];
}

export interface BrowserInstance {
  id: string;
  version(): string;
  isConnected(): boolean;
  createPage(url?: string): Promise<PageInstance>;
  close(): Promise<void>;
}

export interface BrowserManager {
  setAdapter(adapter: BrowserAdapter): void;
  launchBrowser(options?: LaunchOptions): Promise<BrowserInstance>;
  createPage(url?: string): Promise<PageInstance>;
  closeBrowser(): Promise<void>;
  takeScreenshot(options?: ScreenshotOptions): Promise<Buffer>;
  getPageContent(): Promise<string>;
  switchBrowser(browserType: BrowserType): Promise<void>;
  getCurrentAdapter(): BrowserAdapter | null;
  getCurrentBrowser(): BrowserInstance | null;
  getCurrentPage(): Promise<PageInstance | null>;
  getRegistry(): any; // BrowserAdapterRegistry
  isReady(): boolean;
  getBrowserInfo(): { adapter: string; version: string; connected: boolean } | null;
  navigate(url: string): Promise<void>;
  click(selector: string): Promise<void>;
  type(selector: string, text: string): Promise<void>;
  waitForSelector(selector: string, timeout?: number): Promise<void>;
}

export interface ScreenshotOptions {
  path?: string;
  type?: 'png' | 'jpeg';
  quality?: number;
  fullPage?: boolean;
  clip?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
