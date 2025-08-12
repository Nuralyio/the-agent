import { BrowserAdapterRegistry } from '../adapters/adapter-registry';
import { AIEngine } from '../ai/ai-engine';
import { BrowserManagerImpl } from '../managers/browser-manager';
import { ActionEngine } from '../engine/action-engine';
import * as crypto from 'crypto';
import {
  AIConfig,
  BrowserAdapter,
  BrowserConfig,
  BrowserType,
  ExecutionOptions,
  LaunchOptions,
  TaskResult,
  TaskContext,
  PageState
} from '../types';
import { executionStream } from '../streaming/execution-stream';

/**
 * Main Browser Automation Framework class
 */
export class BrowserAutomation {
  private browserManager: BrowserManagerImpl;
  private registry: BrowserAdapterRegistry;
  private config: BrowserConfig;
  private aiConfig?: AIConfig;
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

  /**
   * Initialize the framework with the specified configuration
   */
  async initialize(): Promise<void> {
    // Auto-select adapter if needed
    if (this.config.adapter === 'auto') {
      const adapter = await this.registry.autoSelectAdapter({
        browserType: this.config.browserType,
        features: [],
        crossBrowser: false
      });
      this.config.adapter = adapter.name;
    }

    // Set up browser launch options
    const launchOptions: LaunchOptions = {
      headless: this.config.headless || false,
      viewport: this.config.viewport
    };

    // Add optional launch options
    if (this.config.userAgent) launchOptions.userAgent = this.config.userAgent;
    if (this.config.locale) launchOptions.locale = this.config.locale;
    if (this.config.timezone) launchOptions.timezone = this.config.timezone;
    if (this.config.proxy) launchOptions.proxy = this.config.proxy;

    await this.browserManager.launchBrowser(launchOptions);

    // Create an initial blank page to ensure we have an active page
    await this.browserManager.createPage();
    console.log('📄 Initial page created successfully');

    // Initialize AI engine if configuration is provided
    if (this.aiConfig) {
      console.log('🤖 Initializing AI engine with config:', this.aiConfig);
      this.aiEngine = new AIEngine();
      
      // Ensure model is provided for the AI engine
      const aiEngineConfig = {
        ...this.aiConfig,
        model: this.aiConfig.model || 'llama3.2'  // Default model if not specified
      };
      
      // Use the provider specified in the config, fallback to 'ollama'
      const providerName = this.aiConfig.provider || 'ollama';
      this.aiEngine.addProvider(providerName, aiEngineConfig);
      this.actionEngine = new ActionEngine(this.browserManager, this.aiEngine);
      console.log('✅ ActionEngine initialized successfully');
    } else {
      console.log('⚠️  No AI configuration found, ActionEngine will not be available');
    }
  }

  /**
   * Execute a natural language task
   */
  async execute(instruction: string, options?: ExecutionOptions): Promise<TaskResult> {
    if (!this.browserManager.isReady()) {
      await this.initialize();
    }

    // If we have an ActionEngine (AI is configured), use it for intelligent planning
    if (this.actionEngine) {
      console.log('🎯 Using ActionEngine for intelligent task planning');
      
      // Convert ExecutionOptions to TaskContext if provided
      let taskContext: TaskContext | undefined;
      if (options) {
        const currentState = await this.captureCurrentState();
        taskContext = {
          id: crypto.randomUUID(),
          objective: instruction,
          constraints: [],
          variables: {},
          history: [],
          currentState,
          url: currentState.url,
          pageTitle: currentState.title
        };
      }
      
      return await this.actionEngine.executeTask(instruction, taskContext);
    }

    // Fallback to basic execution without AI
    console.log('⚠️  Falling back to basic execution (no AI configuration)');
    return this.basicExecute(instruction, options);
  }

  /**
   * Execute a task using the ActionEngine (AI-powered)
   */
  async executeTask(instruction: string, options?: ExecutionOptions): Promise<TaskResult> {
    return this.execute(instruction, options);
  }

  /**
   * Basic execution without AI (fallback)
   */
  private async basicExecute(instruction: string, options?: ExecutionOptions): Promise<TaskResult> {
    throw new Error('Basic execution not implemented. Please configure AI support.');
  }

  /**
   * Navigate to a URL
   */
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

  /**
   * Take a screenshot
   */
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

  /**
   * Get the current page title
   */
  async getTitle(): Promise<string> {
    const currentPage = await this.browserManager.getCurrentPage();
    if (!currentPage) {
      throw new Error('No active page available');
    }

    return await currentPage.getTitle();
  }

  /**
   * Get the current page URL
   */
  async getUrl(): Promise<string> {
    const currentPage = await this.browserManager.getCurrentPage();
    if (!currentPage) {
      throw new Error('No active page available');
    }

    return await currentPage.getUrl();
  }

  /**
   * Wait for an element to be visible
   */
  async waitForElement(selector: string, timeout = 30000): Promise<void> {
    const currentPage = await this.browserManager.getCurrentPage();
    if (!currentPage) {
      throw new Error('No active page available');
    }

    await currentPage.waitForElement(selector, timeout);
  }

  /**
   * Click an element
   */
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

  /**
   * Type text into an element
   */
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

  /**
   * Get the current browser adapter
   */
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

  /**
   * Close the browser and clean up resources
   */
  async close(): Promise<void> {
    if (this.browserManager.isReady()) {
      await this.browserManager.closeBrowser();
    }
  }

  /**
   * Get browser manager for advanced operations
   */
  getBrowserManager(): BrowserManagerImpl {
    return this.browserManager;
  }

  /**
   * Get action engine for advanced AI operations
   */
  getActionEngine(): ActionEngine | undefined {
    return this.actionEngine;
  }

  /**
   * Check if the framework is ready
   */
  isReady(): boolean {
    return this.browserManager.isReady();
  }

  /**
   * Get current configuration
   */
  getConfig(): BrowserConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<BrowserConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Capture current page state
   */
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
