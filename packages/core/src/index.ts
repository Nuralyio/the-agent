// Main framework exports
export { TheAgent } from './the-agent';

// Adapter exports
export { BrowserAdapterRegistry } from './adapters/adapter-registry';
export { PlaywrightAdapter } from './adapters/playwright/adapter';
export { PuppeteerAdapter } from './adapters/puppeteer/adapter';

// Engine exports
export { ActionEngine } from './engine/action-engine';
export { AIEngine } from './engine/ai-engine';
export { setPauseChecker } from './engine/execution/action-sequence-executor';
export { Planner } from './engine/planning/planner';

// Streaming exports
export { ExecutionStream, executionStream } from './events/execution-stream';

// Type exports
export * from './types';

