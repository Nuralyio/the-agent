import 'reflect-metadata';
import { container } from 'tsyringe';

// Import types and interfaces

// DI Tokens - these are used to identify dependencies
export const DI_TOKENS = {
  // Config tokens
  AI_CONFIG: Symbol('AIConfig'),
  BROWSER_CONFIG: Symbol('BrowserConfig'),

  // Service tokens
  BROWSER_MANAGER: Symbol('BrowserManager'),
  AI_ENGINE: Symbol('AIEngine'),
  ACTION_ENGINE: Symbol('ActionEngine'),
  PLANNER: Symbol('Planner'),

  // Adapter tokens
  BROWSER_ADAPTER_REGISTRY: Symbol('BrowserAdapterRegistry'),

  // Utility tokens
  STEP_CONTEXT_MANAGER: Symbol('StepContextManager'),
  EXECUTION_LOGGER: Symbol('ExecutionLogger'),
} as const;

/**
 * Container configuration for dependency injection
 */
export class DIContainer {
  private static _instance: DIContainer;

  private constructor() {
    // No automatic configuration - let the main classes handle their own registration
  }

  public static getInstance(): DIContainer {
    if (!DIContainer._instance) {
      DIContainer._instance = new DIContainer();
    }
    return DIContainer._instance;
  }

  public registerConfig<T>(token: symbol, config: T): void {
    container.registerInstance(token, config);
  }


  public getContainer() {
    return container;
  }

  public resolve<T>(token: symbol | string): T {
    return container.resolve<T>(token as any);
  }

  public clear(): void {
    container.clearInstances();
  }

  public isRegistered(token: symbol | string): boolean {
    return container.isRegistered(token as any);
  }
}

export const diContainer = DIContainer.getInstance();

export { container };
