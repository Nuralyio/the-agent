import * as playwright from 'playwright';
import { BrowserAdapter, BrowserInstance, BrowserType, LaunchOptions } from '../types';
import { PlaywrightBrowserInstance } from './instance';

/**
 * Playwright browser adapter implementation
 * Provides cross-browser support for Chromium, Firefox, and WebKit
 */
export class PlaywrightAdapter implements BrowserAdapter {
  public readonly name = 'playwright';
  public readonly type = BrowserType.CHROMIUM; // Default type
  public readonly version = '1.x';

  /**
   * Check if Playwright is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      return !!playwright.chromium;
    } catch {
      return false;
    }
  }

  /**
   * Get default launch options
   */
  getDefaultOptions(): LaunchOptions {
    return {
      headless: true,
      timeout: 30000,
      args: []
    };
  }

  /**
   * Get supported browser types
   */
  getSupportedBrowsers(): BrowserType[] {
    return [BrowserType.CHROMIUM, BrowserType.FIREFOX, BrowserType.WEBKIT];
  }

  /**
   * Launch a browser instance using Playwright
   */
  async launch(options: LaunchOptions): Promise<BrowserInstance> {
    const browserType = this.getBrowserType(options);

    const launchOptions: any = {
      headless: options.headless ?? true,
      args: options.args ?? []
    };

    if (options.executablePath) {
      launchOptions.executablePath = options.executablePath;
    }

    if (options.proxy) {
      if (typeof options.proxy === 'string') {
        launchOptions.proxy = { server: options.proxy };
      } else {
        launchOptions.proxy = {
          server: options.proxy.server,
          username: options.proxy.username,
          password: options.proxy.password,
          bypass: options.proxy.bypass?.join(',')
        };
      }
    }

    const browser = await browserType.launch(launchOptions);
    return new PlaywrightBrowserInstance(browser, options);
  }

  /**
   * Get Playwright browser type based on options
   */
  private getBrowserType(options: LaunchOptions) {
    // Default to chromium if no browser type specified
    if (!options.args) {
      return playwright.chromium;
    }

    // Check for browser type in args
    const browserArg = options.args.find((arg: string) =>
      arg.includes('firefox') || arg.includes('webkit') || arg.includes('chromium')
    );

    if (browserArg?.includes('firefox')) {
      return playwright.firefox;
    } else if (browserArg?.includes('webkit')) {
      return playwright.webkit;
    }

    return playwright.chromium;
  }

  /**
   * Check if Playwright is available
   */
  static async isAvailable(): Promise<boolean> {
    try {
      await import('playwright');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get browser version information
   */
  async getBrowserVersion(browserType: BrowserType): Promise<string> {
    try {
      const browser = await this.getBrowserTypeForEnum(browserType).launch({ headless: true });
      const version = browser.version();
      await browser.close();
      return version;
    } catch (error) {
      throw new Error(`Failed to get browser version: ${error}`);
    }
  }

  /**
   * Map BrowserType enum to Playwright browser type
   */
  private getBrowserTypeForEnum(browserType: BrowserType) {
    switch (browserType) {
      case BrowserType.FIREFOX:
        return playwright.firefox;
      case BrowserType.WEBKIT:
        return playwright.webkit;
      case BrowserType.CHROMIUM:
      case BrowserType.CHROME:
      default:
        return playwright.chromium;
    }
  }
}
