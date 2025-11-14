/**
 * Playwright implementation of content extractor
 */

import type { Page } from 'playwright';
import { BaseContentExtractor, AbstractPage, AbstractFrame } from './base-extractor';

/**
 * Adapter to make Playwright Page compatible with AbstractPage
 */
class PlaywrightPageAdapter implements AbstractPage {
  constructor(private playwrightPage: Page) {}

  evaluate<T>(pageFunction: (...args: any[]) => T, ...args: any[]): Promise<T> {
    // Playwright's evaluate signature is compatible but TypeScript needs help
    return this.playwrightPage.evaluate(pageFunction, ...args) as Promise<T>;
  }

  title(): Promise<string> {
    return this.playwrightPage.title();
  }

  url(): string {
    return this.playwrightPage.url();
  }

  frames(): AbstractFrame[] {
    return this.playwrightPage.frames().map(f => new PlaywrightFrameAdapter(f));
  }

  mainFrame(): AbstractFrame {
    return new PlaywrightFrameAdapter(this.playwrightPage.mainFrame());
  }
}

/**
 * Adapter to make Playwright Frame compatible with AbstractFrame
 */
class PlaywrightFrameAdapter implements AbstractFrame {
  constructor(private playwrightFrame: any) {}

  evaluate<T>(pageFunction: (...args: any[]) => T, ...args: any[]): Promise<T> {
    // Playwright Frame's evaluate signature is compatible but TypeScript needs help
    return this.playwrightFrame.evaluate(pageFunction, ...args) as Promise<T>;
  }

  url(): string {
    return this.playwrightFrame.url();
  }

  name(): string {
    return this.playwrightFrame.name();
  }
}

/**
 * Playwright-based content extractor implementation
 * Extends BaseContentExtractor to eliminate code duplication
 */
export class PlaywrightContentExtractor extends BaseContentExtractor {
  constructor(playwrightPage: Page) {
    super(new PlaywrightPageAdapter(playwrightPage));
  }
  // All functionality is inherited from BaseContentExtractor
}
