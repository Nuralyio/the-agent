import { PageInstance, ElementHandle, ScreenshotOptions, WaitOptions } from '../types';
import { PlaywrightElementHandle } from './playwright-element';
import type { Page, BrowserContext } from 'playwright';

/**
 * Playwright implementation of PageInstance
 */
export class PlaywrightPageInstance implements PageInstance {
  constructor(
    private page: Page,
    private context: BrowserContext
  ) {}

  /**
   * Get the page URL
   */
  async getUrl(): Promise<string> {
    return this.page.url();
  }

  /**
   * Get the page title
   */
  async getTitle(): Promise<string> {
    return this.page.title();
  }

  /**
   * Navigate to a URL
   */
  async navigate(url: string): Promise<void> {
    await this.page.goto(url);
  }

  /**
   * Get page content
   */
  async content(): Promise<string> {
    return this.page.content();
  }

  /**
   * Take a screenshot
   */
  async screenshot(options?: ScreenshotOptions): Promise<Buffer> {
    const screenshotOptions: Parameters<Page['screenshot']>[0] = {};
    
    if (options?.fullPage !== undefined) screenshotOptions.fullPage = options.fullPage;
    if (options?.path) screenshotOptions.path = options.path;
    if (options?.type) screenshotOptions.type = options.type;
    if (options?.quality !== undefined) screenshotOptions.quality = options.quality;

    const result = await this.page.screenshot(screenshotOptions);
    return Buffer.from(result);
  }

  /**
   * Find element by selector
   */
  async findElement(selector: string): Promise<ElementHandle | null> {
    try {
      const locator = this.page.locator(selector);
      await locator.waitFor({ timeout: 5000, state: 'attached' });
      return new PlaywrightElementHandle(locator);
    } catch {
      return null;
    }
  }

  /**
   * Find all elements by selector
   */
  async findElements(selector: string): Promise<ElementHandle[]> {
    const locator = this.page.locator(selector);
    const count = await locator.count();
    const elements: ElementHandle[] = [];
    
    for (let i = 0; i < count; i++) {
      elements.push(new PlaywrightElementHandle(locator.nth(i)));
    }
    
    return elements;
  }

  /**
   * Wait for selector to appear
   */
  async waitForSelector(selector: string, options?: WaitOptions): Promise<ElementHandle> {
    const waitOptions: { timeout?: number; state?: 'attached' | 'detached' | 'visible' | 'hidden' } = {};
    
    if (options?.timeout) waitOptions.timeout = options.timeout;
    if (options?.state) waitOptions.state = options.state;

    // Use locator instead of waitForSelector for better compatibility
    const locator = this.page.locator(selector);
    const locatorOptions: any = {};
    if (options?.timeout) locatorOptions.timeout = options.timeout;
    if (options?.state) locatorOptions.state = options.state;
    
    await locator.waitFor(locatorOptions);
    
    return new PlaywrightElementHandle(locator);
  }

  /**
   * Close the page
   */
  async close(): Promise<void> {
    await this.page.close();
    await this.context.close();
  }

  /**
   * Execute JavaScript on the page
   */
  async evaluate<T>(fn: () => T): Promise<T> {
    return this.page.evaluate(fn);
  }

  /**
   * Click on an element
   */
  async click(selector: string): Promise<void> {
    await this.page.click(selector);
  }

  /**
   * Type text into an element
   */
  async type(selector: string, text: string): Promise<void> {
    await this.page.fill(selector, text);
  }

  /**
   * Wait for a specific amount of time
   */
  async wait(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms);
  }

  /**
   * Wait for page load
   */
  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState('load');
  }

  /**
   * Get text content of an element
   */
  async getText(selector: string): Promise<string> {
    const element = await this.page.locator(selector);
    return (await element.textContent()) || '';
  }

  /**
   * Get attribute value of an element
   */
  async getAttribute(selector: string, attribute: string): Promise<string | null> {
    const element = await this.page.locator(selector);
    return element.getAttribute(attribute);
  }

  /**
   * Check if element is visible
   */
  async isVisible(selector: string): Promise<boolean> {
    try {
      const element = await this.page.locator(selector);
      return element.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Scroll to element
   */
  async scrollTo(selector: string): Promise<void> {
    await this.page.locator(selector).scrollIntoViewIfNeeded();
  }
}
