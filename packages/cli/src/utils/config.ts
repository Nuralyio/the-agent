import fs from 'fs/promises';
import path from 'path';
import { CLIConfig } from '../types';

const defaultConfig: CLIConfig = {
  adapter: 'playwright',
  browser: 'chrome',
  headless: false,
  timeout: 30000,
  retries: 3,
  ai: {
    provider: 'openai',
    model: 'gpt-4o',
    baseUrl: 'https://api.openai.com/v1'
  },
  screenshots: {
    enabled: true,
    path: './screenshots'
  }
};

export async function loadConfig(configPath?: string): Promise<CLIConfig> {
  const configFile = configPath || findConfigFile();
  
  if (!configFile) {
    return defaultConfig;
  }

  try {
    const configContent = await fs.readFile(configFile, 'utf-8');
    let config: CLIConfig;
    
    if (configFile.endsWith('.json')) {
      config = JSON.parse(configContent);
    } else {
      // For .js files, we need to require them
      delete require.cache[path.resolve(configFile)];
      config = require(path.resolve(configFile));
    }
    
    return { ...defaultConfig, ...config };
  } catch (error) {
    console.warn(`Warning: Could not load config from ${configFile}, using defaults`);
    return defaultConfig;
  }
}

function findConfigFile(): string | null {
  const possiblePaths = [
    'theagent.config.js',
    'theagent.config.json',
    '.theagentrc.js',
    '.theagentrc.json'
  ];

  for (const configPath of possiblePaths) {
    try {
      require.resolve(path.resolve(configPath));
      return configPath;
    } catch {
      // File doesn't exist, continue
    }
  }

  return null;
}

export async function saveConfig(config: Partial<CLIConfig>, configPath = 'theagent.config.js'): Promise<void> {
  const fullConfig = { ...defaultConfig, ...config };
  const configContent = `module.exports = ${JSON.stringify(fullConfig, null, 2)};`;
  await fs.writeFile(configPath, configContent);
}

export function getConfigValue(config: CLIConfig, key: string): any {
  const keys = key.split('.');
  let value: any = config;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return undefined;
    }
  }
  
  return value;
}

export function setConfigValue(config: CLIConfig, key: string, value: any): CLIConfig {
  const keys = key.split('.');
  const newConfig = JSON.parse(JSON.stringify(config)); // Deep clone
  let current = newConfig;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (!current[k] || typeof current[k] !== 'object') {
      current[k] = {};
    }
    current = current[k];
  }
  
  current[keys[keys.length - 1]] = value;
  return newConfig;
}
