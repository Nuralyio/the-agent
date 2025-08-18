import { BrowserAdapterRegistry } from './adapters/adapter-registry';
import { AIEngine } from './engine/ai-engine';
import { ActionEngine } from './engine/action-engine';
import { BrowserManagerImpl } from './managers/browser-manager';
import {
  AIConfig,
  BrowserAdapter,
  BrowserConfig,
  BrowserType,
  ExecutionOptions,
  LaunchOptions,
  TaskResult
} from './types';

/**
 * Main TheAgent Framework class
 */
export class TheAgent {
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
    if (this.aiConfig && this.aiConfig.model) {
      console.log('🤖 Initializing AI engine with config:', this.aiConfig);
      this.aiEngine = new AIEngine();

      // Use the provider specified in the config, fallback to 'ollama'
      const providerName = this.aiConfig.provider || 'ollama';
      this.aiEngine.addProvider(providerName, this.aiConfig as Required<AIConfig>);
      this.actionEngine = new ActionEngine(this.browserManager, this.aiEngine);
      console.log('✅ ActionEngine initialized successfully');
    } else {
      console.log('⚠️  No AI configuration found or model not specified, ActionEngine will not be available');
    }
  }

  /**
   * Execute a natural language task
   */
  async execute(instruction: string, options?: ExecutionOptions): Promise<TaskResult> {
    if (!this.browserManager.isReady()) {
      await this.initialize();
    }

    console.log(`📝 Using TheAgent.execute() for instruction: "${instruction}"`);

    // If we have an ActionEngine (AI is configured), use it for intelligent planning
    if (this.actionEngine) {
      console.log('🎯 Using ActionEngine with planning (unified approach)');
      try {
        // Use executeTask for planning (same as executeTask method)
        return await this.actionEngine.executeTask(instruction);
      } catch (error) {
        console.error('❌ AI execution failed, falling back to basic execution:', error);
        // Fall through to basic execution
      }
    } else {
      console.log('⚠️  No ActionEngine available, using basic execution');
    }

    // Fallback to basic execution for simple commands
    const result: TaskResult = {
      success: true,
      steps: [],
      extractedData: null,
      screenshots: [],
      duration: 0
    };

    try {
      // Parse instruction and execute basic commands
      await this.executeBasicInstruction(instruction);
      result.success = true;
    } catch (error) {
      result.success = false;
      result.error = error instanceof Error ? error.message : String(error);
    }

    return result;
  }

  /**
   * Execute a task using the smart ActionEngine (same as execute())
   * This method is identical to execute() - both use planning
   * Kept for backward compatibility with existing code
   */
  async executeTask(instruction: string): Promise<TaskResult> {
    if (this.actionEngine) {
      console.log('🎯 Using ActionEngine.executeTask for intelligent task planning');
      console.log('🧠 ActionEngine will use Planner for planning');
      console.log(`📝 Task instruction: "${instruction}"`);
      return await this.actionEngine.executeTask(instruction);
    } else {
      console.log('⚠️ No ActionEngine available, falling back to basic execute');
      return await this.execute(instruction);
    }
  }

  /**
   * Navigate to a URL
   */
  async navigate(url: string): Promise<void> {
    await this.browserManager.navigate(url);
  }

  /**
   * Click an element
   */
  async click(selector: string): Promise<void> {
    await this.browserManager.click(selector);
  }

  /**
   * Type text into an element
   */
  async type(selector: string, text: string): Promise<void> {
    await this.browserManager.type(selector, text);
  }

  /**
   * Take a screenshot
   */
  async screenshot(path?: string): Promise<Buffer> {
    const options: any = { fullPage: true };
    if (path) options.path = path;
    return await this.browserManager.takeScreenshot(options);
  }

  /**
   * Get page content
   */
  async getContent(): Promise<string> {
    return await this.browserManager.getPageContent();
  }

  /**
   * Switch to a different browser adapter
   */
  async switchAdapter(adapterName: string): Promise<void> {
    const adapter = this.registry.get(adapterName);
    if (!adapter) {
      throw new Error(`Adapter '${adapterName}' not found`);
    }

    await this.browserManager.closeBrowser();
    this.browserManager.setAdapter(adapter);
    await this.initialize();
  }

  /**
   * Switch to a different browser type
   */
  async switchBrowser(browserType: BrowserType): Promise<void> {
    this.config.browserType = browserType;
    await this.browserManager.switchBrowser(browserType);
  }

  /**
   * Register a custom adapter
   */
  registerAdapter(adapter: BrowserAdapter): void {
    this.registry.register(adapter);
  }

  /**
   * Get available adapters
   */
  getAvailableAdapters(): string[] {
    return this.registry.getAdapterNames();
  }

  /**
   * Get current browser information
   */
  getBrowserInfo() {
    return this.browserManager.getBrowserInfo();
  }

  /**
   * Get the browser manager instance (for advanced usage)
   */
  getBrowserManager() {
    return this.browserManager;
  }

  /**
   * Close the browser and cleanup
   */
  async close(): Promise<void> {
    await this.browserManager.closeBrowser();
  }

  /**
   * Execute basic instruction parsing (simplified)
   */
  private async executeBasicInstruction(instruction: string): Promise<void> {
    const lowerInstruction = instruction.toLowerCase();

    if (lowerInstruction.includes('go to') || lowerInstruction.includes('navigate to')) {
      const urlMatch = instruction.match(/(?:go to|navigate to)\s+(.+)/i);
      if (urlMatch) {
        let url = urlMatch[1]!.trim();
        // Add protocol if missing
        if (!url.startsWith('http')) {
          url = `https://${url}`;
        }
        await this.navigate(url);
      }
    } else if (lowerInstruction.includes('click')) {
      // Extract selector or text to click
      const clickMatch = instruction.match(/click\s+(?:on\s+)?(.+)/i);
      if (clickMatch) {
        const target = clickMatch[1]!.trim();
        // Try as selector first, then as text
        try {
          await this.click(target);
        } catch {
          // If selector fails, try clicking by text
          await this.click(`text=${target}`);
        }
      }
    } else if (lowerInstruction.includes('type') || lowerInstruction.includes('enter')) {
      const typeMatch = instruction.match(/(?:type|enter)\s+"([^"]+)"\s+(?:in|into)\s+(.+)/i);
      if (typeMatch) {
        const text = typeMatch[1]!;
        const selector = typeMatch[2]!.trim();
        await this.type(selector, text);
      }
    }

    // Add small delay for stability
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// Export main class and types
export { BrowserAdapterRegistry } from './adapters/adapter-registry';
export { PlaywrightAdapter } from './adapters/playwright/adapter';
export { PuppeteerAdapter } from './adapters/puppeteer/adapter';
export { AIEngine } from './engine/ai-engine';
export { ActionEngine } from './engine/action-engine';
export { Planner } from './engine/planning/planner';
export { ExecutionStream, executionStream } from './streaming/execution-stream';
export * from './types';

