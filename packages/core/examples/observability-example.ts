/**
 * Example: LLM Observability with OpenTelemetry and Langfuse
 * 
 * This example demonstrates how to enable LLM observability
 * to track and monitor all AI interactions.
 */

import { TheAgent } from '../src/index';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  console.log('🚀 Starting TheAgent with LLM Observability enabled\n');

  // Create agent with observability configuration
  const agent = new TheAgent({
    adapter: 'playwright',
    browserType: 'chromium',
    headless: false,
    ai: {
      provider: process.env.DEFAULT_AI_PROVIDER || 'ollama',
      model: process.env.OLLAMA_MODEL || 'llama3.2',
      apiKey: process.env.OPENAI_API_KEY,
      observability: {
        enabled: process.env.OBSERVABILITY_ENABLED === 'true',
        opentelemetry: {
          enabled: process.env.OTEL_ENABLED === 'true',
          serviceName: process.env.OTEL_SERVICE_NAME || 'the-agent-example',
          endpoint: process.env.OTEL_ENDPOINT,
        },
        langfuse: {
          enabled: process.env.LANGFUSE_ENABLED === 'true',
          publicKey: process.env.LANGFUSE_PUBLIC_KEY,
          secretKey: process.env.LANGFUSE_SECRET_KEY,
          baseUrl: process.env.LANGFUSE_BASE_URL,
        },
      },
    },
  });

  try {
    // Initialize the agent
    console.log('🔧 Initializing agent...');
    await agent.initialize();
    console.log('✅ Agent initialized\n');

    // Execute some tasks - all LLM calls will be traced
    console.log('📝 Executing tasks...');
    
    await agent.navigate('https://example.com');
    console.log('✅ Navigated to example.com');

    const result = await agent.execute('Take a screenshot of the page');
    console.log('✅ Task executed:', result.status);

    console.log('\n🎉 All tasks completed!');
    console.log('\n📊 Observability Data:');
    console.log('   - Check your OpenTelemetry collector (e.g., Jaeger UI at http://localhost:16686)');
    console.log('   - Check your Langfuse dashboard (e.g., https://cloud.langfuse.com)');
    console.log('   - All LLM interactions have been traced and logged');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Clean up
    console.log('\n🧹 Cleaning up...');
    await agent.close();
    console.log('✅ Agent closed');
  }
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}

export default main;
