// Main framework exports
export { TheAgent } from './the-agent';

export * from './di';

// Adapter exports
export { BrowserAdapterRegistry } from './adapters/adapter-registry';
export { PlaywrightAdapter } from './adapters/playwright/adapter';
export { PuppeteerAdapter } from './adapters/puppeteer/adapter';

// Engine exports
export { ActionEngine } from './engine/action-engine';
export { AIEngine } from './engine/ai-engine';
export { setPauseChecker } from './engine/execution/action-sequence-executor';
export { Planner } from './engine/planning/planner';

export { ExecutionStream, executionStream } from './events/execution-stream';

export { ExecutionPlanExporter } from './utils/execution-plan-exporter';
export type {
  ActionStepExport, ExecutionPlanExport, ExecutionSummary,
  ExportMetadata,
  ExportOptions, SubPlanExport
} from './utils/execution-plan-exporter';

export * from './adapters/interfaces';
export * from './engine/planning/types/types';
export * from './types/browser.types';
export * from './types/config.types';
export * from './types/task.types';

// Extractor exports
export * from './extractors';

