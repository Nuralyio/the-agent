/**
 * Generic adapter factory to eliminate code duplication between browser implementations
 */

import { AbstractPage, AbstractFrame } from './base-extractor';

/**
 * Generic page adapter that works with any browser automation library
 * Eliminates code duplication between Playwright and Puppeteer implementations
 */
export class GenericPageAdapter<TPage> implements AbstractPage {
  constructor(private browserPage: TPage) {}

  evaluate<T>(pageFunction: (...args: any[]) => T, ...args: any[]): Promise<T> {
    // Browser page's evaluate signature is compatible but TypeScript needs help
    const page = this.browserPage as any;
    return page.evaluate(pageFunction, ...args) as Promise<T>;
  }

  title(): Promise<string> {
    const page = this.browserPage as any;
    return page.title();
  }

  url(): string {
    const page = this.browserPage as any;
    return page.url();
  }

  frames(): AbstractFrame[] {
    const page = this.browserPage as any;
    return page.frames().map((f: any) => new GenericFrameAdapter(f));
  }

  mainFrame(): AbstractFrame {
    const page = this.browserPage as any;
    return new GenericFrameAdapter(page.mainFrame());
  }
}

/**
 * Generic frame adapter that works with any browser automation library
 * Eliminates code duplication between Playwright and Puppeteer implementations
 */
export class GenericFrameAdapter<TFrame = any> implements AbstractFrame {
  constructor(private browserFrame: TFrame) {}

  evaluate<T>(pageFunction: (...args: any[]) => T, ...args: any[]): Promise<T> {
    // Browser frame's evaluate signature is compatible but TypeScript needs help
    const frame = this.browserFrame as any;
    return frame.evaluate(pageFunction, ...args) as Promise<T>;
  }

  url(): string {
    const frame = this.browserFrame as any;
    return frame.url();
  }

  name(): string {
    const frame = this.browserFrame as any;
    return frame.name();
  }
}
