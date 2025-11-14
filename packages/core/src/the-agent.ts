import * as crypto from 'crypto';
import 'reflect-metadata';
import { BrowserAdapterRegistry } from './adapters/adapter-registry';
import type { BrowserAdapter, LaunchOptions } from './adapters/interfaces';
import { BrowserType } from './adapters/interfaces';
import { ConfigManager } from './config/config-manager';
import { container, DI_TOKENS } from './di/container';
import { ActionEngine } from './engine/action-engine';
import { AIEngine } from './engine/ai-engine';
import { StepContextManager } from './engine/analysis/step-context';
import { Planner } from './engine/planning/planner';
import type { PageState, TaskContext } from './engine/planning/types/types';
import { BrowserManagerImpl } from './managers/browser-manager';
import type { BrowserConfig } from './types/browser.types';
import type { ExecutionOptions, TheAgentConfig } from './types/config.types';
import type { TaskResult } from './types/task.types';
import { ExecutionPlanExporter, type ExecutionPlanExport, type ExportOptions } from './utils/execution-plan-exporter';

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
  private readonly configManager: ConfigManager;
  private actionEngine?: ActionEngine;
  private aiEngine?: AIEngine;

  constructor(config?: Partial<TheAgentConfig>) {
    this.configManager = ConfigManager.getInstance();

    this.setupDependencyInjection();

    this.browserManager = container.resolve(BrowserManagerImpl);
    this.registry = this.browserManager.getRegistry();

    // Legacy browser config format for existing components
    this.config = {
      adapter: 'auto',
      browserType: BrowserType.CHROMIUM,
      headless: true,
      viewport: { width: 1280, height: 720 },
      fallbackAdapters: ['playwright', 'puppeteer'],
      ...(config && config.browser ? config.browser : {})
    };

    // Update config manager if partial config provided
    if (config) {
      this.configManager.updateConfig(config);
    }
  }

  /**
   * Setup dependency injection container
   */
  private setupDependencyInjection(): void {
    container.registerSingleton(DI_TOKENS.BROWSER_MANAGER, BrowserManagerImpl);
    container.registerSingleton(DI_TOKENS.BROWSER_ADAPTER_REGISTRY, BrowserAdapterRegistry);
    container.registerSingleton(DI_TOKENS.AI_ENGINE, AIEngine);
    container.registerSingleton(DI_TOKENS.ACTION_ENGINE, ActionEngine);
    container.registerSingleton(DI_TOKENS.PLANNER, Planner);
    container.registerSingleton(DI_TOKENS.STEP_CONTEXT_MANAGER, StepContextManager);
  }

  /**
   * Convert browser type string to BrowserType enum
   */
  private convertToBrowserType(type: string): BrowserType {
    switch (type?.toLowerCase()) {
      case 'chrome':
      case 'chromium':
        return BrowserType.CHROMIUM;
      case 'firefox':
        return BrowserType.FIREFOX;
      case 'safari':
        return BrowserType.WEBKIT;
      case 'edge':
        return BrowserType.CHROMIUM; // Edge uses Chromium
      default:
        return BrowserType.CHROMIUM; // Default fallback
    }
  }

  async initialize(): Promise<void> {
    // Load unified configuration first
    const fullConfig = await this.configManager.loadConfig();

    // Apply browser configuration from unified config
    if (fullConfig.browser) {
      this.config = {
        ...this.config,
        adapter: fullConfig.browser.adapter || this.config.adapter,
        browserType: this.convertToBrowserType(fullConfig.browser.type),
        headless: fullConfig.browser.headless !== undefined ? fullConfig.browser.headless : this.config.headless,
        viewport: fullConfig.browser.viewport || this.config.viewport,
        timeout: fullConfig.browser.timeout || this.config.timeout,
        retries: fullConfig.browser.retries || this.config.retries
      };
    }

    if (this.config.adapter === 'auto') {
      const adapter = await this.registry.autoSelectAdapter({
        browserType: this.config.browserType,
        features: [],
        crossBrowser: false
      });
      this.config.adapter = adapter.name;
    }

    const launchOptions: LaunchOptions = {
      headless: this.config.headless,
      viewport: this.config.viewport
    };

    if (this.config.userAgent) launchOptions.userAgent = this.config.userAgent;
    if (this.config.locale) launchOptions.locale = this.config.locale;
    if (this.config.timezone) launchOptions.timezone = this.config.timezone;
    if (this.config.proxy) launchOptions.proxy = this.config.proxy;

    await this.browserManager.launchBrowser(launchOptions);
    await this.browserManager.createPage();
    console.log('📄 Initial page created successfully');
    container.registerInstance(DI_TOKENS.BROWSER_MANAGER, this.browserManager);

    // Get active LLM profile
    const activeLLMProfile = this.configManager.getActiveLLMProfile();

    if (activeLLMProfile) {
      console.log('🤖 Initializing AI engine with active LLM profile:', {
        active: fullConfig.llm?.active,
        provider: activeLLMProfile.provider,
        model: activeLLMProfile.model
      });
      this.aiEngine = container.resolve(AIEngine);

      const aiEngineConfig = {
        ...activeLLMProfile,
        model: activeLLMProfile.model || 'llama3.2'
      };

      const providerName = activeLLMProfile.provider || 'ollama';
      this.aiEngine.addProvider(providerName, aiEngineConfig);
      container.registerInstance(DI_TOKENS.AI_ENGINE, this.aiEngine);
      this.actionEngine = container.resolve(ActionEngine);
      console.log('✅ ActionEngine initialized successfully');
    } else {
      console.log('⚠️  No active LLM profile found, ActionEngine will not be available');
      if (fullConfig.llm?.profiles) {
        console.log('Available LLM profiles:', Object.keys(fullConfig.llm.profiles));
      }
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
    // Shutdown observability services to flush traces
    await this.aiEngine?.shutdown();
  }

  /**
   * Shutdown TheAgent and flush all observability traces
   * Call this before your application exits to ensure traces are sent to Langfuse
   */
  async shutdown(): Promise<void> {
    await this.close();
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

  /**
   * Export execution plan from task result
   */
  exportExecutionPlan(
    taskResult: TaskResult,
    originalInstruction: string,
    options: ExportOptions = {}
  ): ExecutionPlanExport {
    return ExecutionPlanExporter.exportFromTaskResult(taskResult, originalInstruction, options);
  }

  /**
   * Export execution plan to JSON
   */
  exportExecutionPlanToJson(
    taskResult: TaskResult,
    originalInstruction: string,
    options: ExportOptions = {}
  ): string {
    const exportData = this.exportExecutionPlan(taskResult, originalInstruction, options);
    return ExecutionPlanExporter.exportToJson(exportData, options.prettify !== false);
  }

  /**
   * Save execution plan export to file
   */
  async saveExecutionPlanExport(
    taskResult: TaskResult,
    originalInstruction: string,
    options: ExportOptions = {}
  ): Promise<string> {
    const exportData = this.exportExecutionPlan(taskResult, originalInstruction, options);
    const filePath = options.filePath || ExecutionPlanExporter.generateFilename(exportData);

    await ExecutionPlanExporter.saveToFile(exportData, filePath, options.prettify !== false);
    console.log(`📄 Execution plan exported to: ${filePath}`);

    return filePath;
  }
}
