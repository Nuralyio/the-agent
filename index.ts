import {
    BrowserConfig,
    BrowserType,
    AIConfig,
    TaskResult,
    ExecutionOptions,
    BrowserAdapter,
    LaunchOptions
} from './types';
import { BrowserManagerImpl } from './core/browser-manager';
import { BrowserAdapterRegistry } from './adapters/adapter-registry';

/**
 * Main Browser Automation Framework class
 */
export class BrowserAutomation {
  private browserManager: BrowserManagerImpl;
  private registry: BrowserAdapterRegistry;
  private config: BrowserConfig;
  private aiConfig?: AIConfig;

  constructor(config?: Partial<BrowserConfig & { ai?: AIConfig }>) {
    this.browserManager = new BrowserManagerImpl();
    this.registry = this.browserManager.getRegistry();
    
    // Default configuration
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
        crossBrowser: false,
        performance: 'balanced'
      });
      this.browserManager.setAdapter(adapter);
    } else {
      const adapter = this.registry.get(this.config.adapter);
      if (!adapter) {
        throw new Error(`Adapter '${this.config.adapter}' not found`);
      }
      this.browserManager.setAdapter(adapter);
    }

    // Launch browser
    const launchOptions: LaunchOptions = {
      headless: this.config.headless,
      viewport: this.config.viewport,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    };

    if (this.config.userAgent) launchOptions.userAgent = this.config.userAgent;
    if (this.config.locale) launchOptions.locale = this.config.locale;
    if (this.config.timezone) launchOptions.timezone = this.config.timezone;
    if (this.config.proxy) launchOptions.proxy = this.config.proxy;

    await this.browserManager.launchBrowser(launchOptions);
  }

  /**
   * Execute a natural language task
   */
  async execute(instruction: string, options?: ExecutionOptions): Promise<TaskResult> {
    if (!this.browserManager.isReady()) {
      await this.initialize();
    }

    // For now, return a basic implementation
    // This will be expanded with AI integration
    const result: TaskResult = {
      success: true,
      steps: [],
      extractedData: null,
      screenshots: []
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

    // Simple pattern matching for basic commands
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
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Export main class and types
export * from './types';
export { BrowserAdapterRegistry } from './adapters/adapter-registry';
export { PlaywrightAdapter } from './adapters/playwright-adapter';
export { PuppeteerAdapter } from './adapters/puppeteer-adapter';
