import { AIEngine } from '../../ai/ai-engine';
import {
  createAIProviderConfigs,
  loadEnvironmentConfig,
  logConfigurationStatus,
  validateDefaultProvider
} from '../../config/environment';
import { ActionEngine } from '../../engine/action-engine';
import { BrowserAutomation } from '../../index';
import { getTestServer, replaceHttpbinUrls, TestServer } from '../test-server';
import { addGlobalCleanupTask } from '../setup';

export interface TestContext {
  automation: BrowserAutomation;
  actionEngine: ActionEngine;
  aiEngine: AIEngine;
  testServer: TestServer;
}

/**
 * Setup test context with browser automation and AI engine
 */
export async function setupTestContext(): Promise<TestContext> {
  console.log('🔧 Setting up test context...');

  // Load configuration from environment variables
  const envConfig = loadEnvironmentConfig();
  logConfigurationStatus(envConfig);

  const automation = new BrowserAutomation({
    adapter: envConfig.browser.adapter as any,
    headless: envConfig.browser.headless,
    browserType: envConfig.browser.type
  });

  // Setup AI Engine with configured providers
  const aiEngine = new AIEngine();
  const providerConfigs = createAIProviderConfigs(envConfig);

  // Add all available providers
  for (const [providerName, config] of Object.entries(providerConfigs)) {
    try {
      console.log(`🔌 Adding ${providerName} provider...`);
      aiEngine.addProvider(providerName, config);
    } catch (error) {
      console.warn(`⚠️ Failed to add ${providerName} provider:`, error);
    }
  }

  // Set the default provider
  const defaultProvider = validateDefaultProvider(envConfig);
  try {
    aiEngine.setDefaultProvider(defaultProvider);
    console.log(`✅ Using ${defaultProvider} as default provider`);
  } catch (error) {
    console.error(`❌ Failed to set default provider ${defaultProvider}:`, error);
    throw error;
  }

  // Create action engine with AI capabilities
  const actionEngine = new ActionEngine(
    automation.getBrowserManager(),
    aiEngine
  );

  // Get test server instance (will be started by test runner)
  const testServer = getTestServer();

  const context = { automation, actionEngine, aiEngine, testServer };
  
  // Register global cleanup for this context
  addGlobalCleanupTask(async () => {
    try {
      await teardownTestContext(context);
    } catch (error) {
      console.warn('Global cleanup failed for context:', error);
    }
  });

  return context;
}

/**
 * Cleanup test context
 */
export async function teardownTestContext(context: TestContext): Promise<void> {
  console.log('🧹 Cleaning up test context...');
  
  try {
    // Close browser automation first
    await context.automation.close();
    
    // Wait for browser processes to fully terminate
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Force any remaining cleanup
    if (context.automation && typeof (context.automation as any).forceCleanup === 'function') {
      await (context.automation as any).forceCleanup();
    }
  } catch (error) {
    console.warn('Error during test context cleanup:', error);
  }
  
  // Note: Test server is managed globally and will be stopped by test runner
}

/**
 * Initialize page for testing
 */
export async function initializePage(automation: BrowserAutomation): Promise<void> {
  console.log('🔧 Initializing automation framework...');

  // Initialize the automation framework to apply configuration
  await automation.initialize();

  // Create a blank page so the action engine has something to work with
  console.log('📄 Opening blank page...');
  await automation.navigate('about:blank');

  // Wait a moment for initialization to complete
  await new Promise(resolve => setTimeout(resolve, 500));
}

/**
 * Test assertion helper
 */
export function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`❌ Test assertion failed: ${message}`);
  }
  console.log(`✅ Assertion passed: ${message}`);
}

/**
 * Execute and validate a test instruction
 */
export async function executeTestInstruction(
  actionEngine: ActionEngine,
  instruction: string,
  testName: string
): Promise<{ success: boolean; steps: any[] }> {
  console.log(`\n📋 ${testName}`);
  
  // Replace httpbin URLs with local test server URLs for stability
  const testServer = getTestServer();
  const localInstruction = replaceHttpbinUrls(instruction, testServer);
  
  console.log(`🤖 Instruction: "${localInstruction}"`);
  if (localInstruction !== instruction) {
    console.log(`🔄 Replaced external URLs with local test server`);
  }

  try {
    // Use executeTask which includes logging and screenshots
    const result = await actionEngine.executeTask(localInstruction);
    console.log(`${result.success ? '✅' : '❌'} Execution result: ${result.success ? 'Success' : 'Failed'}`);

    return {
      success: result.success,
      steps: result.steps
    };
  } catch (error) {
    console.log(`❌ Failed to execute instruction: ${error}`);
    return {
      success: false,
      steps: []
    };
  }
}
