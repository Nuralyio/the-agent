/**
 * Adapter type definitions
 */

export interface BrowserAdapter {
  name: string;
  type: BrowserType;
  launch(options?: LaunchOptions): Promise<BrowserInstance>;
  isAvailable(): Promise<boolean>;
  getSupportedBrowsers(): BrowserType[];
  getDefaultOptions(): LaunchOptions;
}

export interface BrowserInstance {
  type: BrowserType;
  newPage(): Promise<PageInstance>;
  close(): Promise<void>;
  pages(): Promise<PageInstance[]>;
  createPage(url?: string): Promise<PageInstance>;
  isConnected(): boolean;
  version(): string;
}

export interface PageInstance {
  navigate(url: string): Promise<void>;
  getTitle(): Promise<string>;
  getUrl(): Promise<string>;
  screenshot(options?: ScreenshotOptions): Promise<Buffer>;
  findElement(selector: string): Promise<ElementHandle | null>;
  findElements(selector: string): Promise<ElementHandle[]>;
  waitForElement(selector: string, timeout?: number): Promise<ElementHandle>;
  close(): Promise<void>;
  content(): Promise<string>;
  click(selector: string): Promise<void>;
  type(selector: string, text: string): Promise<void>;
  waitForSelector(selector: string, options?: WaitOptions): Promise<ElementHandle>;
  evaluate<T>(fn: () => T): Promise<T>;
  waitForLoad(): Promise<void>;
}

export interface ElementHandle {
  click(): Promise<void>;
  type(text: string): Promise<void>;
  getText(): Promise<string>;
  getAttribute(name: string): Promise<string | null>;
  isVisible(): Promise<boolean>;
  hover(): Promise<void>;
  focus(): Promise<void>;
  scroll(): Promise<void>;
}

export enum BrowserType {
  CHROME = 'chrome',
  CHROMIUM = 'chromium',
  FIREFOX = 'firefox',
  WEBKIT = 'webkit',
  SAFARI = 'safari',
  EDGE = 'edge'
}

export interface LaunchOptions {
  headless?: boolean;
  devtools?: boolean;
  args?: string[];
  slowMo?: number;
  timeout?: number;
  viewport?: { width: number; height: number };
  userAgent?: string;
  locale?: string;
  timezone?: string;
  proxy?: string | {
    server: string;
    username?: string;
    password?: string;
    bypass?: string[];
  };
  executablePath?: string;
}

export interface ScreenshotOptions {
  path?: string;
  fullPage?: boolean;
  quality?: number;
  type?: 'png' | 'jpeg' | 'webp';
  clip?: { x: number; y: number; width: number; height: number };
  omitBackground?: boolean;
}

export interface WaitOptions {
  timeout?: number;
  visible?: boolean;
  hidden?: boolean;
  state?: 'attached' | 'detached' | 'visible' | 'hidden';
}
