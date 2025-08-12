#!/usr/bin/env node

// Re-export CLI functionality
export * from './commands';
export * from './utils';
export * from './types';

// If running directly, execute the CLI
if (require.main === module) {
  require('./cli');
}
