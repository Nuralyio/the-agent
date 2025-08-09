// Main exports
export { AutomationApiServer, automationApiServer } from './app';

// Service exports
export { configService } from './services/config.service';
export { automationService } from './services/automation.service';

// Type exports
export * from './types';

// Controller exports
export { ExecutionController } from './controllers/execution.controller';
export { AutomationController } from './controllers/automation.controller';
export { HealthController } from './controllers/health.controller';

// Utility exports
export { createApp } from './utils/app.utils';
