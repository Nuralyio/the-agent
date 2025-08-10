import { BrowserInstance, PageInstance, LaunchOptions, BrowserType } from '../../types';
import { PuppeteerPageInstance } from './page';
import type { Browser } from 'puppeteer';

/**
 * Puppeteer browser instance implementation
 */
export class PuppeteerBrowserInstance implements BrowserInstance {
  public readonly type = BrowserType.CHROMIUM;

  constructor(
    private browser: Browser,
    private options: LaunchOptions
  ) {}

  /**
   * Create a new page (alias for createPage)
   */
  async newPage(): Promise<PageInstance> {
    return this.createPage();
  }

  /**
   * Get all pages
   */
  async pages(): Promise<PageInstance[]> {
    const pages = await this.browser.pages();
    return pages.map(page => new PuppeteerPageInstance(page));
  }

  /**
   * Create a new page instance
   */
  async createPage(url?: string): Promise<PageInstance> {
    const page = await this.browser.newPage();
    
    // Set viewport if provided
    if (this.options.viewport) {
      await page.setViewport(this.options.viewport);
    }

    // Set user agent if provided
    if (this.options.userAgent) {
      await page.setUserAgent(this.options.userAgent);
    }

    const pageInstance = new PuppeteerPageInstance(page);

    if (url) {
      await pageInstance.navigate(url);
    }

    return pageInstance;
  }

  /**
   * Close the browser
   */
  async close(): Promise<void> {
    await this.browser.close();
  }

  /**
   * Get browser version
   */
  version(): string {
    // Puppeteer's version() returns a Promise, but we need sync for interface
    // Return a placeholder and implement async version separately
    return 'Puppeteer Browser';
  }

  /**
   * Get browser version asynchronously
   */
  async getVersion(): Promise<string> {
    return await this.browser.version();
  }

  /**
   * Check if browser is connected
   */
  isConnected(): boolean {
    return this.browser.isConnected();
  }

  /**
   * Get the underlying Puppeteer browser instance
   */
  getPuppeteerBrowser(): Browser {
    return this.browser;
  }
}
