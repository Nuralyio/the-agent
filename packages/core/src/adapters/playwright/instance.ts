import type { Browser, BrowserContextOptions } from 'playwright';
import { BrowserInstance, BrowserType, LaunchOptions, PageInstance } from '../../types';
import { PlaywrightPageInstance } from './page';

/**
 * Playwright browser instance implementation
 */
export class PlaywrightBrowserInstance implements BrowserInstance {
  public readonly type = BrowserType.CHROMIUM;

  constructor(
    private browser: Browser,
    private options: LaunchOptions
  ) { }

  /**
   * Create a new page instance
   */
  async newPage(): Promise<PageInstance> {
    return this.createPage();
  }

  /**
   * Get all pages
   */
  async pages(): Promise<PageInstance[]> {
    const contexts = this.browser.contexts();
    const allPages: PageInstance[] = [];

    for (const context of contexts) {
      const pages = context.pages();
      for (const page of pages) {
        allPages.push(new PlaywrightPageInstance(page, context));
      }
    }

    return allPages;
  }

  /**
   * Check if browser is connected
   */
  isConnected(): boolean {
    return this.browser.isConnected();
  }

  /**
   * Create a new page instance
   */
  async createPage(url?: string): Promise<PageInstance> {
    const contextOptions: BrowserContextOptions = {};

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
    if (this.options.recordVideo) {
      contextOptions.recordVideo = this.options.recordVideo;
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
   * Get the underlying Playwright browser instance
   */
  getPlaywrightBrowser(): Browser {
    return this.browser;
  }
}
