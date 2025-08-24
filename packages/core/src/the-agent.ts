import * as crypto from 'crypto';
import { BrowserAdapterRegistry } from './adapters/adapter-registry';
import type { BrowserAdapter, LaunchOptions } from './adapters/interfaces';
import { BrowserType } from './adapters/interfaces';
import { ActionEngine } from './engine/action-engine';
import { AIEngine } from './engine/ai-engine';
import type { PageState, TaskContext } from './engine/planning/types/types';
import { BrowserManagerImpl } from './managers/browser-manager';
import type { BrowserConfig } from './types/browser.types';
import type { AIConfig, ExecutionOptions } from './types/config.types';
import type { TaskResult } from './types/task.types';

/**
 * TheAgent - AI-Powered Browser Automation Framework
 *
 * A unified browser automation framework that combines traditional web automation
 * with AI-powered natural language processing. Supports multiple browser adapters
 * (Playwright, Puppeteer, Selenium) and enables complex automation tasks through
 * simple instructions.
 */
export class TheAgent {
  private readonly browserManager: BrowserManagerImpl;
  private registry: BrowserAdapterRegistry;
  private config: BrowserConfig;
  private readonly aiConfig?: AIConfig;
  private actionEngine?: ActionEngine;
  private aiEngine?: AIEngine;

  constructor(config?: Partial<BrowserConfig & { ai?: AIConfig }>) {
    this.browserManager = new BrowserManagerImpl();
    this.registry = this.browserManager.getRegistry();

    this.config = {
      adapter: 'auto',
      browserType: BrowserType.CHROMIUM,
      headless: true,
      viewport: { width: 1280, height: 720 },
      fallbackAdapters: ['playwright', 'puppeteer'],
      ...config
    };

    if (config?.ai) {
      this.aiConfig = config.ai;
    }
  }

  async initialize(): Promise<void> {
    if (this.config.adapter === 'auto') {
      const adapter = await this.registry.autoSelectAdapter({
        browserType: this.config.browserType,
        features: [],
        crossBrowser: false
      });
      this.config.adapter = adapter.name;
    }

    const launchOptions: LaunchOptions = {
      headless: this.config.headless || false,
      viewport: this.config.viewport
    };

    if (this.config.userAgent) launchOptions.userAgent = this.config.userAgent;
    if (this.config.locale) launchOptions.locale = this.config.locale;
    if (this.config.timezone) launchOptions.timezone = this.config.timezone;
    if (this.config.proxy) launchOptions.proxy = this.config.proxy;

    await this.browserManager.launchBrowser(launchOptions);
    await this.browserManager.createPage();
    console.log('📄 Initial page created successfully');

    if (this.aiConfig) {
      console.log('🤖 Initializing AI engine with config:', this.aiConfig);
      this.aiEngine = new AIEngine();

      const aiEngineConfig = {
        ...this.aiConfig,
        model: this.aiConfig.model || 'llama3.2'
      };

      const providerName = this.aiConfig.provider || 'ollama';
      this.aiEngine.addProvider(providerName, aiEngineConfig);
      this.actionEngine = new ActionEngine(this.browserManager, this.aiEngine);
      console.log('✅ ActionEngine initialized successfully');
    } else {
      console.log('⚠️  No AI configuration found, ActionEngine will not be available');
    }
  }

  async execute(instruction: string, options?: ExecutionOptions): Promise<TaskResult> {
    if (!this.browserManager.isReady()) {
      await this.initialize();
    }

    if (this.actionEngine) {
      const currentState = await this.captureCurrentState();
      const taskContext: TaskContext = {
        id: crypto.randomUUID(),
        objective: instruction,
        constraints: [],
        variables: {},
        history: [],
        currentState,
        url: currentState.url,
        pageTitle: currentState.title
      };

      return await this.actionEngine.executeTask(instruction, taskContext);
    } else {
      return {
        success: false,
        error: 'AI configuration required for natural language task execution. Please configure an AI provider.',
        steps: [],
        duration: 0,
        screenshots: [],
        extractedData: null
      };
    }
  }

  async executeTask(instruction: string, options?: ExecutionOptions): Promise<TaskResult> {
    return this.execute(instruction, options);
  }

  async navigate(url: string): Promise<void> {
    if (!this.browserManager.isReady()) {
      await this.initialize();
    }

    const currentPage = await this.browserManager.getCurrentPage();
    if (!currentPage) {
      throw new Error('No active page available');
    }

    await currentPage.navigate(url);
  }

  async screenshot(options?: { path?: string; fullPage?: boolean }): Promise<Buffer> {
    if (!this.browserManager.isReady()) {
      await this.initialize();
    }

    const currentPage = await this.browserManager.getCurrentPage();
    if (!currentPage) {
      throw new Error('No active page available');
    }

    return await currentPage.screenshot(options);
  }

  async getTitle(): Promise<string> {
    const currentPage = await this.browserManager.getCurrentPage();
    if (!currentPage) {
      throw new Error('No active page available');
    }

    return await currentPage.getTitle();
  }

  async getUrl(): Promise<string> {
    const currentPage = await this.browserManager.getCurrentPage();
    if (!currentPage) {
      throw new Error('No active page available');
    }

    return await currentPage.getUrl();
  }

  async waitForElement(selector: string, timeout = 10000): Promise<void> {
    const currentPage = await this.browserManager.getCurrentPage();
    if (!currentPage) {
      throw new Error('No active page available');
    }

    await currentPage.waitForElement(selector, timeout);
  }

  async click(selector: string): Promise<void> {
    const currentPage = await this.browserManager.getCurrentPage();
    if (!currentPage) {
      throw new Error('No active page available');
    }

    const element = await currentPage.findElement(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }

    await element.click();
  }

  async type(selector: string, text: string): Promise<void> {
    const currentPage = await this.browserManager.getCurrentPage();
    if (!currentPage) {
      throw new Error('No active page available');
    }

    const element = await currentPage.findElement(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }

    await element.type(text);
  }

  getCurrentAdapter(): BrowserAdapter | null {
    return this.browserManager.getCurrentAdapter();
  }

  /**
   * Get available adapters
   */
  getAvailableAdapters(): string[] {
    return this.registry.getAdapterNames();
  }

  /**
   * Switch to a different adapter
   */
  async switchAdapter(adapterName: string): Promise<void> {
    const adapter = this.registry.get(adapterName);
    if (!adapter) {
      throw new Error(`Adapter not found: ${adapterName}`);
    }
    this.browserManager.setAdapter(adapter);
  }

  async close(): Promise<void> {
    if (this.browserManager.isReady()) {
      await this.browserManager.closeBrowser();
    }
  }

  getBrowserManager(): BrowserManagerImpl {
    return this.browserManager;
  }

  getActionEngine(): ActionEngine | undefined {
    return this.actionEngine;
  }

  isReady(): boolean {
    return this.browserManager.isReady();
  }

  getConfig(): BrowserConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<BrowserConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  private async captureCurrentState(): Promise<PageState> {
    const page = await this.browserManager.getCurrentPage();
    if (!page) {
      // Return a minimal page state if no page is available
      return {
        url: 'about:blank',
        title: 'No Page',
        content: '',
        screenshot: Buffer.from(''),
        timestamp: Date.now(),
        viewport: { width: 1280, height: 720 },
        elements: []
      };
    }

    const url = await page.evaluate(() => window.location.href);
    const title = await page.evaluate(() => document.title);
    const content = await page.evaluate(() => document.documentElement.outerHTML);
    const screenshot = await page.screenshot();

    return {
      url,
      title,
      content,
      screenshot,
      timestamp: Date.now(),
      viewport: { width: 1280, height: 720 },
      elements: []
    };
  }
}
