/**
 * Simple Browser Test Example
 *
 * Demonstrates basic browser automation with unified configuration.
 * This example opens a webpage, performs basic interactions, and shows
 * how to use TheAgent with the new unified configuration system.
 *
 * Prerequisites:
 *   - Create a theagent.config.js file in any parent directory with:
 *       module.exports = {
 *         browser: {
 *           adapter: 'playwright',
 *           type: 'chrome',
 *           headless: false
 *         },
 *         llm: {
 *           active: 'ollama',
 *           profiles: {
 *             ollama: {
 *               provider: 'ollama',
 *               model: 'qwen3:8b',
 *               baseUrl: 'http://100.115.253.119:11434'
 *             }
 *           }
 *         }
 *       THEAGENT_LLM_PROFILES_OLLAMA_BASE_URL=http://100.115.253.119:11434
 *
 * Run with:
 *   cd packages/core
 *   npx ts-node examples/simple-test-example.ts
 */

import { TheAgent } from '../src/';

async function run() {
  console.log('🚀 Starting simple browser test...');

  // TheAgent will automatically discover configuration from:
  // 1. theagent.config.js in current directory or parent directories
  // 2. Environment variables (THEAGENT_*)
  // 3. Default values
  const agent = new TheAgent();

  try {
    console.log('📖 Initializing browser...');
    await agent.initialize();




    // Navigate to another page
    console.log('🔄 Navigating to Google...');
    await agent.execute('navigate to https://www.amazon.fr');

    await agent.execute('search for "iphone 17"');


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

    // IMPORTANT: Flush observability traces before exit
    console.log('📡 Flushing observability traces...');
    await agent.shutdown();
    console.log('✅ Observability traces flushed');
  }
}

// Handle exit gracefully
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT. Exiting gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM. Exiting gracefully...');
  process.exit(0);
});

// Run the example
run().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
