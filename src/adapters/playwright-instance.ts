import { BrowserInstance, PageInstance, LaunchOptions } from '../types';
import { PlaywrightPageInstance } from './playwright-page';
import type { Browser } from 'playwright';

/**
 * Playwright browser instance implementation
 */
export class PlaywrightBrowserInstance implements BrowserInstance {
  constructor(
    private browser: Browser,
    private options: LaunchOptions
  ) {}

  /**
   * Create a new page instance
   */
  async createPage(url?: string): Promise<PageInstance> {
    const contextOptions: any = {};
    
    if (this.options.viewport) {
      contextOptions.viewport = this.options.viewport;
    }
    if (this.options.userAgent) {
      contextOptions.userAgent = this.options.userAgent;
    }
    if (this.options.locale) {
      contextOptions.locale = this.options.locale;
    }
    if (this.options.timezone) {
      contextOptions.timezoneId = this.options.timezone;
    }

    const context = await this.browser.newContext(contextOptions);
    const page = await context.newPage();
    const pageInstance = new PlaywrightPageInstance(page, context);

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
    return this.browser.version();
  }

  /**
   * Check if browser is connected
   */
  isConnected(): boolean {
    return this.browser.isConnected();
  }

  /**
   * Get the underlying Playwright browser instance
   */
  getPlaywrightBrowser(): Browser {
    return this.browser;
  }
}
