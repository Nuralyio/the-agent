import { AIEngine } from '../ai/ai-engine';
import {
  createAIProviderConfigs, loadEnvironmentConfig,
  logConfigurationStatus,
  validateDefaultProvider
} from '../config/environment';
import { ActionEngine } from '../engine/action-engine';
import { BrowserAutomation } from '../index';

/**
 * AI-powered browser automation example using environment configuration
 */
async function aiAutomationExample() {
  console.log('🤖 Starting AI-Powered Browser Automation Example');

  // Load configuration from environment variables
  const envConfig = loadEnvironmentConfig();
  logConfigurationStatus(envConfig);

  const automation = new BrowserAutomation({
    adapter: envConfig.browser.adapter as any,
    headless: envConfig.browser.headless,
    browserType: envConfig.browser.type
  });

  try {
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
      return;
    }

    // Create action engine with AI capabilities
    const actionEngine = new ActionEngine(
      automation.getBrowserManager(),
      aiEngine
    );

    console.log('🌐 Navigating to example.com...');
    await automation.navigate('https://example.com');

    // Wait a moment for the page to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('🤖 Using AI to parse natural language instructions...');

    // Example 1: Simple navigation instruction
    console.log('\n📋 Example 1: Navigation instruction');
    const instruction1 = "go to https://httpbin.org/html";

    try {
      const plan1 = await actionEngine.parseInstruction(instruction1);
      console.log('✅ Generated action plan:', JSON.stringify(plan1.steps, null, 2));

      const result1 = await actionEngine.executeActionPlan(plan1);
      console.log('✅ Execution result:', result1.success ? 'Success' : 'Failed');
    } catch (error) {
      console.log('❌ Failed to execute instruction 1:', error);
    }

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Example 2: More complex interaction
    console.log('\n📋 Example 2: Complex interaction instruction');
    const instruction2 = "take a screenshot and then scroll down the page";

    try {
      const plan2 = await actionEngine.parseInstruction(instruction2);
      console.log('✅ Generated action plan:', JSON.stringify(plan2.steps, null, 2));

      const result2 = await actionEngine.executeActionPlan(plan2);
      console.log('✅ Execution result:', result2.success ? 'Success' : 'Failed');
    } catch (error) {
      console.log('❌ Failed to execute instruction 2:', error);
    }

    // Example 3: Search interaction (will work if the page has search functionality)
    console.log('\n📋 Example 3: Search instruction');
    const instruction3 = "wait for 2 seconds then take another screenshot";

    try {
      const plan3 = await actionEngine.parseInstruction(instruction3);
      console.log('✅ Generated action plan:', JSON.stringify(plan3.steps, null, 2));

      const result3 = await actionEngine.executeActionPlan(plan3);
      console.log('✅ Execution result:', result3.success ? 'Success' : 'Failed');
    } catch (error) {
      console.log('❌ Failed to execute instruction 3:', error);
    }

    // Example 4: Real-world navigation and interaction
    console.log('\n📋 Example 4: Navigate to httpbin.org and find forms');
    const instruction4 = "navigate to https://httpbin.org/forms/post then look for a text input field and take a screenshot";

    try {
      const plan4 = await actionEngine.parseInstruction(instruction4);
      console.log('✅ Generated action plan:', JSON.stringify(plan4.steps, null, 2));

      const result4 = await actionEngine.executeActionPlan(plan4);
      console.log('✅ Execution result:', result4.success ? 'Success' : 'Failed');
    } catch (error) {
      console.log('❌ Failed to execute instruction 4:', error);
    }

    console.log('\n🎉 AI automation examples completed!');

    // Keep browser open for 5 seconds to see the results
    await new Promise(resolve => setTimeout(resolve, 5000));

  } catch (error) {
    console.error('❌ Error during automation:', error);
  } finally {
    console.log('🧹 Cleaning up...');
    await automation.close();
  }
}



// Main execution
async function main() {
  console.log('🤖 Starting AI-Powered Browser Automation Example');
  await aiAutomationExample();
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  process.exit(0);
});

// Run the example
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

export { aiAutomationExample };
