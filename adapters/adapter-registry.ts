import { BrowserAdapter, BrowserRequirements, BrowserType } from '../types';
import { PlaywrightAdapter } from './playwright-adapter';
import { PuppeteerAdapter } from './puppeteer-adapter';

/**
 * Browser adapter registry for managing multiple browser engines
 */
export class BrowserAdapterRegistry {
  private adapters = new Map<string, BrowserAdapter>();

  constructor() {
    // Register default adapters
    this.registerDefaultAdapters();
  }

  /**
   * Register a browser adapter
   */
  register(adapter: BrowserAdapter): void {
    this.adapters.set(adapter.name, adapter);
  }

  /**
   * Get adapter by name
   */
  get(name: string): BrowserAdapter | undefined {
    return this.adapters.get(name);
  }

  /**
   * Get all available adapters
   */
  getAvailable(): BrowserAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Get adapter names
   */
  getAdapterNames(): string[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Check if adapter exists
   */
  has(name: string): boolean {
    return this.adapters.has(name);
  }

  /**
   * Remove adapter
   */
  unregister(name: string): boolean {
    return this.adapters.delete(name);
  }

  /**
   * Get the best adapter based on requirements
   */
  getBestAdapter(requirements: BrowserRequirements): BrowserAdapter {
    const availableAdapters = this.getAvailable();

    // Filter adapters that support the required browser type
    const compatibleAdapters = availableAdapters.filter(adapter =>
      adapter.getSupportedBrowsers().includes(requirements.browserType)
    );

    if (compatibleAdapters.length === 0) {
      throw new Error(`No adapter found for browser type: ${requirements.browserType}`);
    }

    // Score adapters based on requirements
    const scoredAdapters = compatibleAdapters.map(adapter => ({
      adapter,
      score: this.calculateAdapterScore(adapter, requirements)
    }));

    // Sort by score (highest first)
    scoredAdapters.sort((a, b) => b.score - a.score);

    return scoredAdapters[0]!.adapter;
  }

  /**
   * Get adapter for specific browser type with fallbacks
   */
  getAdapterForBrowser(browserType: BrowserType, fallbacks?: string[]): BrowserAdapter {
    // First, try to find any adapter that supports the browser type
    const compatibleAdapters = this.getAvailable().filter(adapter =>
      adapter.getSupportedBrowsers().includes(browserType)
    );

    if (compatibleAdapters.length > 0) {
      return compatibleAdapters[0]!;
    }

    // If no compatible adapter found, try fallbacks
    if (fallbacks) {
      for (const fallbackName of fallbacks) {
        const fallbackAdapter = this.get(fallbackName);
        if (fallbackAdapter) {
          return fallbackAdapter;
        }
      }
    }

    throw new Error(`No adapter found for browser type: ${browserType}`);
  }

  /**
   * Auto-select adapter based on availability and requirements
   */
  async autoSelectAdapter(requirements?: Partial<BrowserRequirements>): Promise<BrowserAdapter> {
    const defaultRequirements: BrowserRequirements = {
      browserType: BrowserType.CHROMIUM,
      features: [],
      crossBrowser: false,
      performance: 'balanced',
      ...requirements
    };

    // Check adapter availability
    const availableAdapters: BrowserAdapter[] = [];

    for (const adapter of this.getAvailable()) {
      if (await this.isAdapterAvailable(adapter)) {
        availableAdapters.push(adapter);
      }
    }

    if (availableAdapters.length === 0) {
      throw new Error('No browser adapters are available');
    }

    // If only one adapter is available, use it
    if (availableAdapters.length === 1) {
      return availableAdapters[0]!;
    }

    // Otherwise, select the best one based on requirements
    return this.getBestAdapter(defaultRequirements);
  }

  /**
   * Register default adapters
   */
  private registerDefaultAdapters(): void {
    // Register Playwright adapter
    this.register(new PlaywrightAdapter());

    // Register Puppeteer adapter
    this.register(new PuppeteerAdapter());
  }

  /**
   * Calculate adapter score based on requirements
   */
  private calculateAdapterScore(adapter: BrowserAdapter, requirements: BrowserRequirements): number {
    let score = 0;

    // Browser type support (highest priority)
    if (adapter.getSupportedBrowsers().includes(requirements.browserType)) {
      score += 100;
    }

    // Cross-browser support
    if (requirements.crossBrowser) {
      score += adapter.getSupportedBrowsers().length * 10;
    }

    // Performance preference
    switch (requirements.performance) {
      case 'fast':
        // Prefer Puppeteer for speed (Chrome-only)
        if (adapter.name === 'puppeteer') score += 30;
        break;
      case 'robust':
        // Prefer Playwright for robustness
        if (adapter.name === 'playwright') score += 30;
        break;
      case 'balanced':
        // Slight preference for Playwright
        if (adapter.name === 'playwright') score += 15;
        if (adapter.name === 'puppeteer') score += 10;
        break;
    }

    // Feature support (simplified scoring)
    if (requirements.features.length > 0) {
      // Playwright generally has more features
      if (adapter.name === 'playwright') score += requirements.features.length * 5;
      if (adapter.name === 'puppeteer') score += requirements.features.length * 3;
    }

    return score;
  }

  /**
   * Check if adapter is available (can be imported and used)
   */
  private async isAdapterAvailable(adapter: BrowserAdapter): Promise<boolean> {
    try {
      switch (adapter.name) {
        case 'playwright':
          return await PlaywrightAdapter.isAvailable();
        case 'puppeteer':
          return await PuppeteerAdapter.isAvailable();
        default:
          return true; // Assume custom adapters are available
      }
    } catch {
      return false;
    }
  }
}
