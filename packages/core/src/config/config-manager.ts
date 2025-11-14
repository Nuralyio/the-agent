import fs from 'fs/promises';
import path from 'path';
import { TheAgentConfig } from '../types/config.types';

/**
 * Unified configuration manager for TheAgent
 * Provides hierarchical configuration discovery and management
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private config: TheAgentConfig | null = null;

  private constructor() { }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Load configuration with hierarchical discovery
   */
  async loadConfig(startDir?: string): Promise<TheAgentConfig> {
    if (this.config) {
      return this.config;
    }

    const searchPaths = this.getConfigSearchPaths(startDir || process.cwd());
    const fileConfig = await this.discoverConfigFile(searchPaths);
    const envConfig = this.loadEnvironmentConfig();

    this.config = this.mergeConfigs([
      this.getDefaultConfig(),
      fileConfig,
      envConfig
    ]);

    return this.config;
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): TheAgentConfig {
    return {
      browser: {
        adapter: 'playwright',
        type: 'chrome',
        headless: false,
        timeout: 30000,
        retries: 3,
        viewport: { width: 1280, height: 720 }
      },
      llm: {
        active: 'default',
        profiles: {
          default: {
            provider: 'openai',
            model: 'gpt-4o',
            baseUrl: 'https://api.openai.com/v1',
            description: 'Default OpenAI GPT-4o'
          },
          local: {
            provider: 'ollama',
            model: 'llama3:8b',
            baseUrl: 'http://localhost:11434',
            description: 'Local Ollama LLaMA'
          }
        }
      },
      execution: {
        logsDir: './execution-logs',
        screenshotsDir: './screenshots',
        screenshotOnError: true
      }
    };
  }

  /**
   * Get configuration search paths in order of precedence
   */
  private getConfigSearchPaths(startDir: string): string[] {
    const paths: string[] = [];

    // Walk up from current directory to workspace root
    let currentDir = path.resolve(startDir);
    while (currentDir !== path.parse(currentDir).root) {
      paths.push(currentDir);
      const parent = path.dirname(currentDir);
      if (parent === currentDir) break;
      currentDir = parent;

      // Stop at workspace root (has package.json with workspaces)
      if (this.isWorkspaceRoot(currentDir)) {
        paths.push(currentDir);
        break;
      }
    }

    return paths;
  }

  /**
   * Check if directory is workspace root
   */
  private isWorkspaceRoot(dir: string): boolean {
    try {
      const packageJsonPath = path.join(dir, 'package.json');
      const packageJson = require(packageJsonPath);
      return !!packageJson.workspaces;
    } catch (error: any) {
      // Return false for missing files (ENOENT) or module not found errors
      // Log parsing errors for debugging purposes
      if (error.code !== 'ENOENT' && error.code !== 'MODULE_NOT_FOUND') {
        console.warn(`Warning: Failed to parse package.json at ${dir}:`, error.message);
      }
      return false;
    }
  }

  /**
   * Discover configuration file in search paths
   */
  private async discoverConfigFile(searchPaths: string[]): Promise<Partial<TheAgentConfig>> {
    const configFileName = 'theagent.config.js';

    for (const searchPath of searchPaths) {
      const configPath = path.join(searchPath, configFileName);
      try {
        await fs.access(configPath);
        const resolvedPath = path.resolve(configPath);
        
        // Validate that the resolved path is within expected directories
        // to prevent potential code injection attacks
        const isValidPath = searchPaths.some(searchPath => 
          resolvedPath.startsWith(path.resolve(searchPath))
        );
        
        if (!isValidPath) {
          console.warn(`Security warning: Config file path ${resolvedPath} is outside expected directories`);
          continue;
        }
        
        delete require.cache[resolvedPath];
        const config = require(resolvedPath);
        return config.default || config;
      } catch {
        // File doesn't exist, continue searching
      }
    }

    return {};
  }

  /**
   * Load configuration from environment variables
   */
  private loadEnvironmentConfig(): Partial<TheAgentConfig> {
    const config: any = {};

    // Browser configuration
    const browserConfig: any = {};
    if (process.env.THEAGENT_ADAPTER) {
      browserConfig.adapter = process.env.THEAGENT_ADAPTER;
    }
    if (process.env.THEAGENT_BROWSER) {
      browserConfig.type = process.env.THEAGENT_BROWSER;
    }
    if (process.env.THEAGENT_HEADLESS) {
      browserConfig.headless = process.env.THEAGENT_HEADLESS === 'true';
    }
    if (process.env.THEAGENT_TIMEOUT) {
      browserConfig.timeout = parseInt(process.env.THEAGENT_TIMEOUT);
    }
    if (process.env.THEAGENT_RETRIES) {
      browserConfig.retries = parseInt(process.env.THEAGENT_RETRIES);
    }
    if (Object.keys(browserConfig).length > 0) {
      config.browser = browserConfig;
    }

    // LLM configuration with profiles
    const llmConfig: any = {};

    // Handle active profile selection
    if (process.env.THEAGENT_LLM_ACTIVE) {
      llmConfig.active = process.env.THEAGENT_LLM_ACTIVE;
    }

    // Handle single profile from environment (backward compatibility)
    const hasLegacyConfig = process.env.THEAGENT_LLM_PROVIDER || process.env.THEAGENT_AI_PROVIDER;
    if (hasLegacyConfig) {
      const profileName = process.env.THEAGENT_LLM_PROFILE || 'env';
      llmConfig.profiles = {
        [profileName]: {}
      };

      if (process.env.THEAGENT_LLM_PROVIDER || process.env.THEAGENT_AI_PROVIDER) {
        llmConfig.profiles[profileName].provider = process.env.THEAGENT_LLM_PROVIDER || process.env.THEAGENT_AI_PROVIDER;
      }
      if (process.env.THEAGENT_LLM_MODEL || process.env.THEAGENT_AI_MODEL) {
        llmConfig.profiles[profileName].model = process.env.THEAGENT_LLM_MODEL || process.env.THEAGENT_AI_MODEL;
      }
      const apiKey = process.env.THEAGENT_LLM_API_KEY || process.env.THEAGENT_AI_API_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
      if (apiKey) {
        llmConfig.profiles[profileName].apiKey = apiKey;
      }
      if (process.env.THEAGENT_LLM_BASE_URL || process.env.THEAGENT_AI_BASE_URL) {
        llmConfig.profiles[profileName].baseUrl = process.env.THEAGENT_LLM_BASE_URL || process.env.THEAGENT_AI_BASE_URL;
      }
      if (process.env.THEAGENT_LLM_TEMPERATURE || process.env.THEAGENT_AI_TEMPERATURE) {
        llmConfig.profiles[profileName].temperature = parseFloat(process.env.THEAGENT_LLM_TEMPERATURE || process.env.THEAGENT_AI_TEMPERATURE!);
      }
      if (process.env.THEAGENT_LLM_MAX_TOKENS || process.env.THEAGENT_AI_MAX_TOKENS) {
        llmConfig.profiles[profileName].maxTokens = parseInt(process.env.THEAGENT_LLM_MAX_TOKENS || process.env.THEAGENT_AI_MAX_TOKENS!);
      }

      // Set as active if not specified
      if (!llmConfig.active) {
        llmConfig.active = profileName;
      }
    }

    if (Object.keys(llmConfig).length > 0) {
      config.llm = llmConfig;
    }

    // Execution configuration
    const executionConfig: any = {};
    if (process.env.THEAGENT_LOGS_DIR) {
      executionConfig.logsDir = process.env.THEAGENT_LOGS_DIR;
    }
    if (process.env.THEAGENT_SCREENSHOTS_DIR) {
      executionConfig.screenshotsDir = process.env.THEAGENT_SCREENSHOTS_DIR;
    }
    if (process.env.THEAGENT_SCREENSHOT_ON_ERROR) {
      executionConfig.screenshotOnError = process.env.THEAGENT_SCREENSHOT_ON_ERROR === 'true';
    }
    if (Object.keys(executionConfig).length > 0) {
      config.execution = executionConfig;
    }

    return config;
  }

  /**
   * Merge multiple configuration objects with deep merging
   */
  private mergeConfigs(configs: Partial<TheAgentConfig>[]): TheAgentConfig {
    const result = {} as TheAgentConfig;

    for (const config of configs) {
      if (config.browser) {
        result.browser = { ...result.browser, ...config.browser };
      }
      if (config.llm) {
        // Initialize result.llm if it doesn't exist
        if (!result.llm) {
          result.llm = {} as any;
        }
        if (config.llm.active) {
          result.llm.active = config.llm.active;
        }
        if (config.llm.profiles) {
          result.llm.profiles = { ...result.llm.profiles, ...config.llm.profiles };
        }
      }
      if (config.execution) {
        result.execution = { ...result.execution, ...config.execution };
      }
    }

    return result;
  }

  /**
   * Get current configuration
   */
  getConfig(): TheAgentConfig | null {
    return this.config;
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<TheAgentConfig>): void {
    if (!this.config) {
      throw new Error("ConfigManager: Cannot update config before it has been loaded. Please call loadConfig() first.");
    }
    this.config = this.mergeConfigs([this.config, updates]);
  }

  /**
   * Get the active LLM profile
   */
  getActiveLLMProfile(): TheAgentConfig['llm']['profiles'][string] | null {
    if (!this.config?.llm) return null;

    const activeProfileName = this.config.llm.active;
    if (!activeProfileName || !this.config.llm.profiles[activeProfileName]) {
      console.warn(`Active LLM profile '${activeProfileName}' not found. Available profiles:`, Object.keys(this.config.llm.profiles));
      // Return first available profile as fallback
      const firstProfile = Object.keys(this.config.llm.profiles)[0];
      return firstProfile ? this.config.llm.profiles[firstProfile] : null;
    }

    return this.config.llm.profiles[activeProfileName];
  }

  /**
   * Switch to a different LLM profile
   */
  switchLLMProfile(profileName: string): boolean {
    if (!this.config?.llm?.profiles?.[profileName]) {
      console.error(`LLM profile '${profileName}' not found. Available profiles:`, Object.keys(this.config?.llm?.profiles || {}));
      return false;
    }

    this.config.llm.active = profileName;
    console.log(`Switched to LLM profile: ${profileName}`);
    return true;
  }

  /**
   * List available LLM profiles
   */
  listLLMProfiles(): { name: string; profile: TheAgentConfig['llm']['profiles'][string]; isActive: boolean }[] {
    if (!this.config?.llm?.profiles) return [];

    return Object.entries(this.config.llm.profiles).map(([name, profile]) => ({
      name,
      profile,
      isActive: name === this.config?.llm?.active
    }));
  }

  /**
   * Reset configuration (force reload on next access)
   */
  reset(): void {
    this.config = null;
  }
}
