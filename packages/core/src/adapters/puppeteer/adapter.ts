import { BrowserAdapter, BrowserType, LaunchOptions, BrowserInstance } from '../types';
import { PuppeteerBrowserInstance } from './instance';
import puppeteer from 'puppeteer';

/**
 * Puppeteer browser adapter implementation
 * Provides Chrome/Chromium support with lightweight footprint
 */
export class PuppeteerAdapter implements BrowserAdapter {
  public readonly name = 'puppeteer';
  public readonly type = BrowserType.CHROMIUM; // Puppeteer only supports Chromium
  public readonly version = '24.x';

  /**
   * Check if Puppeteer is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      return !!puppeteer;
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
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    };
  }

  /**
   * Get supported browser types
   */
  getSupportedBrowsers(): BrowserType[] {
    return [BrowserType.CHROMIUM];
  }

  /**
   * Launch a browser instance using Puppeteer
   */
  async launch(options: LaunchOptions): Promise<BrowserInstance> {
    const launchOptions: any = {
      headless: options.headless ?? true,
      args: options.args ?? []
    };

    if (options.executablePath) {
      launchOptions.executablePath = options.executablePath;
    }

    const browser = await puppeteer.launch(launchOptions);
    return new PuppeteerBrowserInstance(browser, options);
  }

  /**
   * Get browser version information
   */
  async getBrowserVersion(): Promise<string> {
    try {
      const browser = await puppeteer.launch({ headless: true });
      const version = await browser.version();
      await browser.close();
      return version;
    } catch (error) {
      throw new Error(`Failed to get browser version: ${error}`);
    }
  }
}
