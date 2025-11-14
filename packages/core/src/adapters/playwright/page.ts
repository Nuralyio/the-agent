import type { BrowserContext, Page } from 'playwright';
import { ElementHandle, PageInstance, ScreenshotOptions, VideoRecordingOptions, WaitOptions } from '../interfaces';
import { PlaywrightElementHandle } from './element';
import { ContentExtractor, PlaywrightContentExtractor } from '../../extractors';

/**
 * Playwright implementation of PageInstance
 */
export class PlaywrightPageInstance implements PageInstance {
  private isRecording = false;
  private videoPath: string | null = null;
  private contentExtractor: ContentExtractor | null = null;

  constructor(
    private page: Page,
    private context: BrowserContext
  ) { }

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
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
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
    if (options?.type && (options.type === 'png' || options.type === 'jpeg')) {
      screenshotOptions.type = options.type;
    }
    if (options?.quality !== undefined) screenshotOptions.quality = options.quality;

    const result = await this.page.screenshot(screenshotOptions);
    return Buffer.from(result);
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
    const locatorOptions: { timeout?: number; state?: 'attached' | 'detached' | 'visible' | 'hidden' } = {};
    if (options?.timeout) locatorOptions.timeout = options.timeout;
    if (options?.state) locatorOptions.state = options.state;

    await locator.waitFor(locatorOptions);

    return new PlaywrightElementHandle(locator);
  }

  /**
   * Find element by selector
   */
  async findElement(selector: string): Promise<ElementHandle | null> {
    try {
      const locator = this.page.locator(selector).first();
      const element = await locator.elementHandle();
      return element ? new PlaywrightElementHandle(locator) : null;
    } catch {
      return null;
    }
  }

  /**
   * Find elements by selector
   */
  async findElements(selector: string): Promise<ElementHandle[]> {
    const locators = this.page.locator(selector);
    const count = await locators.count();
    const elements: ElementHandle[] = [];

    for (let i = 0; i < count; i++) {
      elements.push(new PlaywrightElementHandle(locators.nth(i)));
    }

    return elements;
  }

  /**
   * Wait for element to appear and return it
   */
  async waitForElement(selector: string, timeout?: number): Promise<ElementHandle> {
    const options = timeout ? { timeout } : {};
    return this.waitForSelector(selector, options);
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

  /**
   * Start video recording
   */
  async startVideoRecording(options?: VideoRecordingOptions): Promise<void> {
    if (this.isRecording) {
      throw new Error('Video recording is already in progress');
    }

    // Check if the context already has video recording enabled
    const video = this.page.video();
    if (video) {
      this.isRecording = true;
      this.videoPath = await video.path();
      return;
    }

    // If no video recording is set up at context level, we can't start recording
    // for an existing page. This would require creating a new context with video recording enabled.
    throw new Error('Video recording must be enabled when creating the browser context. Please restart the browser with video recording enabled.');
  }

  /**
   * Stop video recording
   */
  async stopVideoRecording(): Promise<string | null> {
    if (!this.isRecording) {
      return null;
    }

    const video = this.page.video();
    if (video) {
      await this.page.close();
      const videoPath = await video.path();
      this.isRecording = false;
      this.videoPath = null;
      return videoPath;
    }

    this.isRecording = false;
    return this.videoPath;
  }

  /**
   * Check if video recording is active
   */
  isVideoRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Get the content extractor for this page
   */
  getContentExtractor(): ContentExtractor {
    if (!this.contentExtractor) {
      this.contentExtractor = new PlaywrightContentExtractor(this.page);
    }
    return this.contentExtractor;
  }
}
