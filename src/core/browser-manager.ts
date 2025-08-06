import { BrowserAdapterRegistry } from '../adapters/adapter-registry';
import {
  BrowserAdapter,
  BrowserInstance,
  BrowserManager,
  BrowserType,
  LaunchOptions,
  PageInstance,
  ScreenshotOptions
} from '../types';

/**
 * Browser manager implementation with adapter abstraction
 */
export class BrowserManagerImpl implements BrowserManager {
  private currentAdapter: BrowserAdapter | null = null;
  private currentBrowser: BrowserInstance | null = null;
  private currentPage: PageInstance | null = null;
  private registry: BrowserAdapterRegistry;
  private defaultLaunchOptions?: LaunchOptions;

  constructor() {
    this.registry = new BrowserAdapterRegistry();
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
      // Auto-select adapter if none is set
      this.currentAdapter = await this.registry.autoSelectAdapter();
    }

    const defaultOptions = this.currentAdapter.getDefaultOptions();
    const mergedOptions = { ...defaultOptions, ...options };

    // Store the options for future auto-launches
    if (options) {
      this.defaultLaunchOptions = options;
    }

    this.currentBrowser = await this.currentAdapter.launch(mergedOptions);
    return this.currentBrowser;
  }

  /**
   * Create a new page
   */
  async createPage(url?: string): Promise<PageInstance> {
    if (!this.currentBrowser) {
      // Use stored launch options if available, otherwise use defaults
      await this.launchBrowser(this.defaultLaunchOptions);
    }

    this.currentPage = await this.currentBrowser!.createPage(url);
    return this.currentPage;
  }

  /**
   * Close the current browser
   */
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

  /**
   * Take a screenshot of the current page
   */
  async takeScreenshot(options?: ScreenshotOptions): Promise<Buffer> {
    if (!this.currentPage) {
      throw new Error('No active page. Create a page first.');
    }

    return await this.currentPage.screenshot(options);
  }

  /**
   * Get the current page content
   */
  async getPageContent(): Promise<string> {
    if (!this.currentPage) {
      throw new Error('No active page. Create a page first.');
    }

    return await this.currentPage.content();
  }

  /**
   * Switch to a different browser type
   */
  async switchBrowser(browserType: BrowserType): Promise<void> {
    // Close current browser if open
    await this.closeBrowser();

    // Get adapter for the new browser type
    const adapter = this.registry.getAdapterForBrowser(browserType);
    this.setAdapter(adapter);

    // Launch new browser
    await this.launchBrowser();
  }

  /**
   * Get the current adapter
   */
  getCurrentAdapter(): BrowserAdapter | null {
    return this.currentAdapter;
  }

  /**
   * Get the current browser instance
   */
  getCurrentBrowser(): BrowserInstance | null {
    return this.currentBrowser;
  }

  /**
   * Get the current page instance
   */
  async getCurrentPage(): Promise<PageInstance | null> {
    return this.currentPage;
  }

  /**
   * Get the adapter registry
   */
  getRegistry(): BrowserAdapterRegistry {
    return this.registry;
  }

  /**
   * Check if browser is ready
   */
  isReady(): boolean {
    return this.currentBrowser !== null && this.currentBrowser.isConnected();
  }

  /**
   * Get browser information
   */
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

  /**
   * Navigate to URL (convenience method)
   */
  async navigate(url: string): Promise<void> {
    if (!this.currentPage) {
      await this.createPage();
    }

    await this.currentPage!.navigate(url);
  }

  /**
   * Click element (convenience method)
   */
  async click(selector: string): Promise<void> {
    if (!this.currentPage) {
      throw new Error('No active page. Create a page first.');
    }

    await this.currentPage.click(selector);
  }

  /**
   * Type text (convenience method)
   */
  async type(selector: string, text: string): Promise<void> {
    if (!this.currentPage) {
      throw new Error('No active page. Create a page first.');
    }

    await this.currentPage.type(selector, text);
  }

  /**
   * Wait for selector (convenience method)
   */
  async waitForSelector(selector: string, timeout?: number): Promise<void> {
    if (!this.currentPage) {
      throw new Error('No active page. Create a page first.');
    }

    const options = timeout ? { timeout } : undefined;
    await this.currentPage.waitForSelector(selector, options);
  }
}
