import { loadConfig, saveConfig, getConfigValue, setConfigValue } from '../utils/config';
import { createLogger } from '../utils/logger';
import { ConfigOptions } from '../types';

export async function configCommand(options: ConfigOptions = {}) {
  const logger = createLogger();
  
  try {
    const config = await loadConfig();
    
    if (options.list) {
      // List all configuration values
      logger.info('📋 Current configuration:');
      console.log(JSON.stringify(config, null, 2));
      process.exit(0);
    }
    
    if (options.get) {
      // Get a specific configuration value
      const value = getConfigValue(config, options.get);
      if (value !== undefined) {
        console.log(JSON.stringify(value, null, 2));
        process.exit(0);
      } else {
        logger.error(`Configuration key '${options.get}' not found`);
        process.exit(1);
      }
    }
    
    if (options.set && options.value !== undefined) {
      // Set a configuration value
      try {
        let parsedValue: any = options.value;
        
        // Try to parse as JSON first
        try {
          parsedValue = JSON.parse(options.value);
        } catch {
          // If JSON parsing fails, treat as string
          // Handle boolean and number strings
          if (options.value === 'true') parsedValue = true;
          else if (options.value === 'false') parsedValue = false;
          else if (!isNaN(Number(options.value))) parsedValue = Number(options.value);
        }
        
        const newConfig = setConfigValue(config, options.set, parsedValue);
        await saveConfig(newConfig);
        
        logger.success(`✅ Configuration updated: ${options.set} = ${JSON.stringify(parsedValue)}`);
        process.exit(0);
      } catch (error) {
        logger.error(`Failed to set configuration: ${error instanceof Error ? error.message : error}`);
        process.exit(1);
      }
    }
    
    // Interactive configuration
    await interactiveConfig();
    
  } catch (error) {
    logger.error(`Configuration error: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}

async function interactiveConfig() {
  const { default: inquirer } = await import('inquirer');
  const logger = createLogger();
  
  const config = await loadConfig();
  
  const { action } = await inquirer.prompt([{
    type: 'list',
    name: 'action',
    message: 'What would you like to configure?',
    choices: [
      { name: 'Automation adapter (playwright, puppeteer, selenium)', value: 'adapter' },
      { name: 'Default browser (chrome, firefox, safari, edge)', value: 'browser' },
      { name: 'Headless mode', value: 'headless' },
      { name: 'Timeout settings', value: 'timeout' },
      { name: 'AI configuration', value: 'ai' },
      { name: 'Screenshot settings', value: 'screenshots' },
      { name: 'View all settings', value: 'view' },
      { name: 'Reset to defaults', value: 'reset' }
    ]
  }]);
  
  switch (action) {
    case 'adapter':
      const { adapter } = await inquirer.prompt([{
        type: 'list',
        name: 'adapter',
        message: 'Choose automation adapter:',
        choices: ['playwright', 'puppeteer', 'selenium'],
        default: config.adapter
      }]);
      config.adapter = adapter;
      break;
      
    case 'browser':
      const { browser } = await inquirer.prompt([{
        type: 'list',
        name: 'browser',
        message: 'Choose default browser:',
        choices: ['chrome', 'firefox', 'safari', 'edge'],
        default: config.browser
      }]);
      config.browser = browser;
      break;
      
    case 'headless':
      const { headless } = await inquirer.prompt([{
        type: 'confirm',
        name: 'headless',
        message: 'Run in headless mode by default?',
        default: config.headless
      }]);
      config.headless = headless;
      break;
      
    case 'timeout':
      const { timeout, retries } = await inquirer.prompt([
        {
          type: 'number',
          name: 'timeout',
          message: 'Default timeout (ms):',
          default: config.timeout
        },
        {
          type: 'number',
          name: 'retries',
          message: 'Default retry count:',
          default: config.retries
        }
      ]);
      config.timeout = timeout;
      config.retries = retries;
      break;
      
    case 'ai':
      const aiConfig = await inquirer.prompt([
        {
          type: 'list',
          name: 'provider',
          message: 'AI Provider:',
          choices: ['ollama', 'openai', 'anthropic'],
          default: config.ai.provider
        },
        {
          type: 'input',
          name: 'model',
          message: 'AI Model:',
          default: config.ai.model
        },
        {
          type: 'input',
          name: 'baseUrl',
          message: 'Base URL (for Ollama):',
          default: config.ai.baseUrl,
          when: (answers: any) => answers.provider === 'ollama'
        },
        {
          type: 'password',
          name: 'apiKey',
          message: 'API Key:',
          when: (answers: any) => answers.provider !== 'ollama'
        }
      ]);
      config.ai = { ...config.ai, ...aiConfig };
      break;
      
    case 'screenshots':
      const screenshotConfig = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'enabled',
          message: 'Enable screenshots by default?',
          default: config.screenshots.enabled
        },
        {
          type: 'input',
          name: 'path',
          message: 'Screenshot directory:',
          default: config.screenshots.path
        }
      ]);
      config.screenshots = { ...config.screenshots, ...screenshotConfig };
      break;
      
    case 'view':
      logger.info('📋 Current configuration:');
      console.log(JSON.stringify(config, null, 2));
      process.exit(0);
      
    case 'reset':
      const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: 'Are you sure you want to reset to default configuration?',
        default: false
      }]);
      
      if (confirm) {
        await saveConfig({});
        logger.success('✅ Configuration reset to defaults');
      }
      process.exit(0);
  }
  
  await saveConfig(config);
  logger.success('✅ Configuration updated successfully');
  process.exit(0);
}
