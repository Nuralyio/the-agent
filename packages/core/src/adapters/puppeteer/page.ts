import type { Page, ScreenshotOptions as PuppeteerScreenshotOptions } from 'puppeteer';
import { ElementHandle, PageInstance, ScreenshotOptions, VideoRecordingOptions, WaitOptions } from '../interfaces';
import { PuppeteerElementHandle } from './element';

/**
 * Puppeteer page instance implementation
 */
export class PuppeteerPageInstance implements PageInstance {
  constructor(private page: Page) { }

  /**
   * Navigate to a URL
   */
  async navigate(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  /**
   * Click an element by selector
   */
  async click(selector: string): Promise<void> {
    await this.page.click(selector);
  }

  /**
   * Type text into an element
   */
  async type(selector: string, text: string): Promise<void> {
    await this.page.type(selector, text);
  }

  /**
   * Take a screenshot
   */
  async screenshot(options?: ScreenshotOptions): Promise<Buffer> {
    const screenshotOptions: PuppeteerScreenshotOptions = {};

    if (options?.path) screenshotOptions.path = options.path as `${string}.png` | `${string}.jpeg` | `${string}.webp`;
    if (options?.type) screenshotOptions.type = options.type;
    if (options?.quality) screenshotOptions.quality = options.quality;
    if (options?.fullPage) screenshotOptions.fullPage = options.fullPage;
    if (options?.clip) screenshotOptions.clip = options.clip;
    if (options?.omitBackground) screenshotOptions.omitBackground = options.omitBackground;

    const screenshot = await this.page.screenshot(screenshotOptions);
    return Buffer.from(screenshot);
  }

  /**
   * Get page content
   */
  async content(): Promise<string> {
    return await this.page.content();
  }

  /**
   * Wait for selector and return element handle
   */
  async waitForSelector(selector: string, options?: WaitOptions): Promise<ElementHandle> {
    const waitOptions: Parameters<Page['waitForSelector']>[1] = {};

    if (options?.timeout) waitOptions.timeout = options.timeout;
    if (options?.visible !== undefined) waitOptions.visible = options.visible;
    if (options?.hidden !== undefined) waitOptions.hidden = options.hidden;

    const element = await this.page.waitForSelector(selector, waitOptions);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }

    return new PuppeteerElementHandle(element);
  }

  /**
   * Close the page
   */
  async close(): Promise<void> {
    await this.page.close();
  }

  /**
   * Get the underlying Puppeteer page instance
   */
  getPuppeteerPage(): Page {
    return this.page;
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Get current URL
   */
  async getUrl(): Promise<string> {
    return this.page.url();
  }

  /**
   * Find element by selector
   */
  async findElement(selector: string): Promise<ElementHandle | null> {
    try {
      const element = await this.page.$(selector);
      return element ? new PuppeteerElementHandle(element) : null;
    } catch {
      return null;
    }
  }

  /**
   * Find elements by selector
   */
  async findElements(selector: string): Promise<ElementHandle[]> {
    const elements = await this.page.$$(selector);
    return elements.map(element => new PuppeteerElementHandle(element));
  }

  /**
   * Wait for element to appear and return it
   */
  async waitForElement(selector: string, timeout?: number): Promise<ElementHandle> {
    const element = await this.page.waitForSelector(selector, { timeout });
    if (!element) {
      throw new Error(`Element with selector "${selector}" not found`);
    }
    return new PuppeteerElementHandle(element);
  }

  /**
   * Execute JavaScript on the page
   */
  async evaluate<T>(fn: () => T): Promise<T> {
    return this.page.evaluate(fn);
  }

  /**
   * Wait for page load
   */
  async waitForLoad(): Promise<void> {
    await this.page.waitForNavigation({ waitUntil: 'domcontentloaded' });
  }

  /**
   * Scroll page
   */
  async scroll(direction: 'up' | 'down' | 'left' | 'right', amount: number = 100): Promise<void> {
    await this.page.evaluate(({ direction, amount }) => {
      switch (direction) {
        case 'up':
          window.scrollBy(0, -amount);
          break;
        case 'down':
          window.scrollBy(0, amount);
          break;
        case 'left':
          window.scrollBy(-amount, 0);
          break;
        case 'right':
          window.scrollBy(amount, 0);
          break;
      }
    }, { direction, amount });
  }

  /**
   * Start video recording (not supported by Puppeteer)
   */
  async startVideoRecording(options?: VideoRecordingOptions): Promise<void> {
    throw new Error('Video recording is not supported by Puppeteer adapter. Please use Playwright adapter for video recording.');
  }

  /**
   * Stop video recording (not supported by Puppeteer)
   */
  async stopVideoRecording(): Promise<string | null> {
    throw new Error('Video recording is not supported by Puppeteer adapter. Please use Playwright adapter for video recording.');
  }

  /**
   * Check if video recording is active (not supported by Puppeteer)
   */
  isVideoRecording(): boolean {
    return false;
  }
}
