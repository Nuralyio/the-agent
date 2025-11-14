import { ConfigManager } from '@theagent/core/src/config/config-manager';
import { CLIConfig } from '../types';

export async function loadConfig(configPath?: string): Promise<CLIConfig> {
  const configManager = ConfigManager.getInstance();
  return await configManager.loadConfig(configPath ? require('path').dirname(configPath) : undefined);
}

export async function saveConfig(config: Partial<CLIConfig>, configPath = 'theagent.config.js'): Promise<void> {
  const fs = require('fs/promises');
  const configContent = `module.exports = ${JSON.stringify(config, null, 2)};`;
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
