/**
 * Simple Browser Test Example
 *
 * Demonstrates basic browser automation without accessibility features.
 * This example opens a webpage, performs basic interactions, and shows
 * how to use TheAgent for simple automation tasks.
 *
 * Prerequisites:
 *   - Create a .env file in the packages/core directory with:
 *       AGENT_AI_PROVIDER=ollama
 *       AGENT_AI_MODEL=qwen3:8b
 *       AGENT_AI_BASE_URL=http://100.115.253.119:11434
 *
 * Run with:
 *   cd packages/core
 *   npx ts-node examples/simple-test-example.ts
 */

import dotenv from 'dotenv';
import { BrowserType, TheAgent } from '../src/';

// Load environment variables from .env file
dotenv.config();

function buildAIConfig(): any {
  const provider = process.env.AGENT_AI_PROVIDER || 'ollama';
  const model = process.env.AGENT_AI_MODEL || 'qwen3:8b';
  const baseUrl = process.env.AGENT_AI_BASE_URL || "http://localhost:11434";

  const config: any = {
    provider,
    model
  };

  if (baseUrl) {
    config.baseUrl = baseUrl;
  }

  console.log(`🤖 Using AI Provider: ${provider}`);
  console.log(`🧠 Using Model: ${model}`);
  console.log(`🌐 Using Base URL: ${baseUrl}`);

  return config;
}

async function run() {
  console.log('🚀 Starting simple browser test...');

  const agent = new TheAgent({
    browserType: BrowserType.CHROMIUM,
    headless: false,
    ai: buildAIConfig()
  });

  try {
    console.log('📖 Initializing browser...');
    await agent.initialize();

    console.log('🌐 Navigating to example page...');

    // Navigate to a simple test page
    await agent.navigate('https://example.com');

    console.log('✅ Successfully navigated to example.com');

    // Get page title
    const title = await agent.getTitle();
    console.log(`📄 Page title: ${title}`);

    // Get page URL
    const url = await agent.getUrl();
    console.log(`🌐 Page URL: ${url}`);

    // Take a screenshot
    console.log('📸 Taking screenshot...');
    await agent.screenshot({ path: 'simple-test-screenshot.png' });
    console.log('✅ Screenshot saved as simple-test-screenshot.png');

    // Wait for a moment to see the page
    console.log('⏱️ Waiting 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Navigate to another page
    console.log('🔄 Navigating to Google...');
    await agent.navigate('https://google.com');

    const googleTitle = await agent.getTitle();
    console.log(`📄 Google page title: ${googleTitle}`);

    // Take another screenshot
    console.log('📸 Taking another screenshot...');
    await agent.screenshot({ path: 'google-screenshot.png' });
    console.log('✅ Screenshot saved as google-screenshot.png');

    console.log('🎉 Simple test completed successfully!');

  } catch (error) {
    console.error('❌ Error during simple test:', error);
  } finally {
    console.log('🔄 Cleaning up...');
    await agent.close();
    console.log('✅ Browser closed');
  }
}

// Handle exit gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT. Exiting gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM. Exiting gracefully...');
  process.exit(0);
});

// Run the example
run().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
