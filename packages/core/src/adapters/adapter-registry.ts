import { singleton } from '../di';
import { BrowserRequirements } from '../types/browser.types';
import { BrowserAdapter, BrowserType } from './interfaces';
import { PlaywrightAdapter } from './playwright/adapter';
import { PuppeteerAdapter } from './puppeteer/adapter';

/**
 * Browser adapter registry for managing multiple browser engines
 */
@singleton()
export class BrowserAdapterRegistry {
  private adapters = new Map<string, BrowserAdapter>();

  constructor() {
    this.registerDefaultAdapters();
  }

  register(adapter: BrowserAdapter): void {
    this.adapters.set(adapter.name, adapter);
  }

  get(name: string): BrowserAdapter | undefined {
    return this.adapters.get(name);
  }

  getAvailable(): BrowserAdapter[] {
    return Array.from(this.adapters.values());
  }

  getAdapterNames(): string[] {
    return Array.from(this.adapters.keys());
  }

  has(name: string): boolean {
    return this.adapters.has(name);
  }

  unregister(name: string): boolean {
    return this.adapters.delete(name);
  }

  getBestAdapter(requirements: BrowserRequirements): BrowserAdapter {
    const availableAdapters = this.getAvailable();

    const compatibleAdapters = availableAdapters.filter(adapter =>
      adapter.getSupportedBrowsers().includes(requirements.browserType)
    );

    if (compatibleAdapters.length === 0) {
      throw new Error(`No adapter found for browser type: ${requirements.browserType}`);
    }

    const scoredAdapters = compatibleAdapters.map(adapter => ({
      adapter,
      score: this.calculateAdapterScore(adapter, requirements)
    }));

    scoredAdapters.sort((a, b) => b.score - a.score);

    return scoredAdapters[0]!.adapter;
  }

  getAdapterForBrowser(browserType: BrowserType, fallbacks?: string[]): BrowserAdapter {
    const compatibleAdapters = this.getAvailable().filter(adapter =>
      adapter.getSupportedBrowsers().includes(browserType)
    );

    if (compatibleAdapters.length > 0) {
      return compatibleAdapters[0]!;
    }

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

  async autoSelectAdapter(requirements?: Partial<BrowserRequirements>): Promise<BrowserAdapter> {
    const defaultRequirements: BrowserRequirements = {
      browserType: BrowserType.CHROMIUM,
      features: [],
      crossBrowser: false,
      performance: 'balanced',
      ...requirements
    };

    const availableAdapters: BrowserAdapter[] = [];

    for (const adapter of this.getAvailable()) {
      if (await this.isAdapterAvailable(adapter)) {
        availableAdapters.push(adapter);
      }
    }

    if (availableAdapters.length === 0) {
      throw new Error('No browser adapters are available');
    }

    if (availableAdapters.length === 1) {
      return availableAdapters[0]!;
    }

    return this.getBestAdapter(defaultRequirements);
  }

  private registerDefaultAdapters(): void {
    this.register(new PlaywrightAdapter());

    this.register(new PuppeteerAdapter());
  }


  private calculateAdapterScore(adapter: BrowserAdapter, requirements: BrowserRequirements): number {
    let score = 0;

    if (adapter.getSupportedBrowsers().includes(requirements.browserType)) {
      score += 100;
    }

    if (requirements.crossBrowser) {
      score += adapter.getSupportedBrowsers().length * 10;
    }

    switch (requirements.performance) {
      case 'fast':
        if (adapter.name === 'puppeteer') score += 30;
        break;
      case 'thorough':
        if (adapter.name === 'playwright') score += 30;
        break;
      case 'balanced':
        if (adapter.name === 'playwright') score += 15;
        if (adapter.name === 'puppeteer') score += 10;
        break;
    }

    if (requirements.features && requirements.features.length > 0) {
      if (adapter.name === 'playwright') score += requirements.features.length * 5;
      if (adapter.name === 'puppeteer') score += requirements.features.length * 3;
    }

    return score;
  }

  private async isAdapterAvailable(adapter: BrowserAdapter): Promise<boolean> {
    try {
      switch (adapter.name) {
        case 'playwright':
          return await adapter.isAvailable();
        case 'puppeteer':
          return await adapter.isAvailable();
        default:
          return true;
      }
    } catch {
      return false;
    }
  }
}
