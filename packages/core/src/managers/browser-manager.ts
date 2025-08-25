import { BrowserAdapterRegistry } from '../adapters/adapter-registry';
import {
  BrowserAdapter,
  BrowserInstance,
  BrowserType,
  LaunchOptions,
  PageInstance,
  ScreenshotOptions
} from '../adapters/interfaces';
import { inject, injectable } from '../di';
import { DI_TOKENS } from '../di/container';
import { BrowserManager } from '../types/browser.types';

/**
 * Browser manager implementation with adapter abstraction
 */
@injectable()
export class BrowserManagerImpl implements BrowserManager {
  private currentAdapter: BrowserAdapter | null = null;
  private currentBrowser: BrowserInstance | null = null;
  private currentPage: PageInstance | null = null;
  private registry: BrowserAdapterRegistry;
  private defaultLaunchOptions?: LaunchOptions;

  constructor(
    @inject(DI_TOKENS.BROWSER_ADAPTER_REGISTRY) registry?: BrowserAdapterRegistry
  ) {
    this.registry = registry || new BrowserAdapterRegistry();
  }

  /**
   * Set the active browser adapter
   */
  setAdapter(adapter: BrowserAdapter): void {
    this.currentAdapter = adapter;
  }

  /**
   * Launch a browser instance
   */
  async launchBrowser(options?: LaunchOptions): Promise<BrowserInstance> {
    if (!this.currentAdapter) {
      this.currentAdapter = await this.registry.autoSelectAdapter();
    }

    const defaultOptions = this.currentAdapter.getDefaultOptions();
    const mergedOptions = { ...defaultOptions, ...options };

    if (options) {
      this.defaultLaunchOptions = options;
    }

    this.currentBrowser = await this.currentAdapter.launch(mergedOptions);
    return this.currentBrowser;
  }

  async createPage(url?: string): Promise<PageInstance> {
    if (!this.currentBrowser) {
      await this.launchBrowser(this.defaultLaunchOptions);
    }

    this.currentPage = await this.currentBrowser!.createPage(url);
    return this.currentPage;
  }

  async closeBrowser(): Promise<void> {
    if (this.currentPage) {
      await this.currentPage.close();
      this.currentPage = null;
    }

    if (this.currentBrowser) {
      await this.currentBrowser.close();
      this.currentBrowser = null;
    }
  }

  async takeScreenshot(options?: ScreenshotOptions): Promise<Buffer> {
    if (!this.currentPage) {
      throw new Error('No active page. Create a page first.');
    }

    return await this.currentPage.screenshot(options);
  }

  async getPageContent(): Promise<string> {
    if (!this.currentPage) {
      throw new Error('No active page. Create a page first.');
    }

    return await this.currentPage.content();
  }

  async switchBrowser(browserType: BrowserType): Promise<void> {
    await this.closeBrowser();

    const adapter = this.registry.getAdapterForBrowser(browserType);
    this.setAdapter(adapter);
    await this.launchBrowser();
  }

  getCurrentAdapter(): BrowserAdapter | null {
    return this.currentAdapter;
  }

  getCurrentBrowser(): BrowserInstance | null {
    return this.currentBrowser;
  }

  async getCurrentPage(): Promise<PageInstance | null> {
    return this.currentPage;
  }

  getRegistry(): BrowserAdapterRegistry {
    return this.registry;
  }


  isReady(): boolean {
    return this.currentBrowser !== null &&
      this.currentBrowser.isConnected() &&
      this.currentPage !== null;
  }

  getBrowserInfo(): { adapter: string; version: string; connected: boolean } | null {
    if (!this.currentAdapter || !this.currentBrowser) {
      return null;
    }

    return {
      adapter: this.currentAdapter.name,
      version: this.currentBrowser.version(),
      connected: this.currentBrowser.isConnected()
    };
  }

  async navigate(url: string): Promise<void> {
    if (!this.currentPage) {
      await this.createPage();
    }

    await this.currentPage!.navigate(url);
  }

  async click(selector: string): Promise<void> {
    if (!this.currentPage) {
      throw new Error('No active page. Create a page first.');
    }
    await this.currentPage.click(selector);
  }

  async type(selector: string, text: string): Promise<void> {
    if (!this.currentPage) {
      throw new Error('No active page. Create a page first.');
    }
    await this.currentPage.type(selector, text);
  }

  async waitForSelector(selector: string, timeout?: number): Promise<void> {
    if (!this.currentPage) {
      throw new Error('No active page. Create a page first.');
    }
    const options = timeout ? { timeout } : undefined;
    await this.currentPage.waitForSelector(selector, options);
  }
}
