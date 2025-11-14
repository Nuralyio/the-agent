/**
 * Puppeteer implementation of content extractor
 */

import type { Page } from 'puppeteer';
import { BaseContentExtractor, AbstractPage, AbstractFrame } from './base-extractor';

/**
 * Adapter to make Puppeteer Page compatible with AbstractPage
 */
class PuppeteerPageAdapter implements AbstractPage {
  constructor(private puppeteerPage: Page) {}

  evaluate<T>(pageFunction: (...args: any[]) => T, ...args: any[]): Promise<T> {
    // Puppeteer's evaluate signature is compatible but TypeScript needs help
    return this.puppeteerPage.evaluate(pageFunction, ...args) as Promise<T>;
  }

  title(): Promise<string> {
    return this.puppeteerPage.title();
  }

  url(): string {
    return this.puppeteerPage.url();
  }

  frames(): AbstractFrame[] {
    return this.puppeteerPage.frames().map(f => new PuppeteerFrameAdapter(f));
  }

  mainFrame(): AbstractFrame {
    return new PuppeteerFrameAdapter(this.puppeteerPage.mainFrame());
  }
}

/**
 * Adapter to make Puppeteer Frame compatible with AbstractFrame
 */
class PuppeteerFrameAdapter implements AbstractFrame {
  constructor(private puppeteerFrame: any) {}

  evaluate<T>(pageFunction: (...args: any[]) => T, ...args: any[]): Promise<T> {
    // Puppeteer Frame's evaluate signature is compatible but TypeScript needs help
    return this.puppeteerFrame.evaluate(pageFunction, ...args) as Promise<T>;
  }

  url(): string {
    return this.puppeteerFrame.url();
  }

  name(): string {
    return this.puppeteerFrame.name();
  }
}

/**
 * Puppeteer-based content extractor implementation
 * Extends BaseContentExtractor to eliminate code duplication
 */
export class PuppeteerContentExtractor extends BaseContentExtractor {
  constructor(puppeteerPage: Page) {
    super(new PuppeteerPageAdapter(puppeteerPage));
  }
  // All functionality is inherited from BaseContentExtractor
}
