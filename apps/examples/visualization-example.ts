import * as dotenv from 'dotenv';
import { AIEngine } from '../ai/ai-engine';
import { ActionEngine } from '../engine/action-engine';
import { BrowserAutomation, BrowserType } from '../index';
import { VisualizationServer } from '../visualization/visualization-server';

// Load environment variables from .env file
dotenv.config();

/**
 * Example demonstrating web-based execution visualization
 * This shows how to integrate browser automation with real-time streaming
 */
async function demonstrateVisualization() {
  console.log('🎬 Starting Browser Automation with Web Visualization');

  // Get configuration from environment variables
  const visualizationPort = parseInt(process.env.VISUALIZATION_PORT || '3002');
  const waitTime = parseInt(process.env.DEMO_WAIT_TIME || '5000');

  // 1. Start the visualization server first
  console.log(`🌐 Starting visualization server on port ${visualizationPort}...`);
  const visualizationServer = new VisualizationServer(visualizationPort);
  await visualizationServer.start();
  console.log(`📺 Open this URL to watch live execution: ${visualizationServer.getServerUrl()}/demo`);

  // Wait a moment for user to open the demo page
  console.log(`⏱️ Please open the demo URL in your browser, then wait ${waitTime / 1000} seconds...`);
  await new Promise(resolve => setTimeout(resolve, waitTime));

  try {
    // 2. Setup browser automation
    const automation = new BrowserAutomation({
      adapter: 'playwright',
      headless: true, // This is the key - headless execution with web visualization!
      browserType: BrowserType.CHROMIUM
    });

    await automation.initialize();

    // 3. Setup AI Engine and Action Engine using environment variables
    const aiEngine = new AIEngine();

    // Get configuration from environment variables
    const aiProvider = process.env.AI_PROVIDER || 'ollama';
    const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const ollamaModel = process.env.OLLAMA_MODEL || 'llama3.1';
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const openaiModel = process.env.OPENAI_MODEL || 'gpt-4';

    // Add available AI providers based on environment configuration
    if (aiProvider === 'ollama' || ollamaBaseUrl) {
      console.log(`🧠 Adding Ollama provider: ${ollamaBaseUrl} (${ollamaModel})`);
      aiEngine.addProvider('ollama', {
        baseUrl: ollamaBaseUrl,
        model: ollamaModel
      });
    }

    if (openaiApiKey) {
      console.log(`🧠 Adding OpenAI provider: ${openaiModel}`);
      aiEngine.addProvider('openai', {
        apiKey: openaiApiKey,
        model: openaiModel
      });
    }

    // Set default provider
    try {
      aiEngine.setDefaultProvider(aiProvider);
      console.log(`✅ Using ${aiProvider} as default AI provider`);
    } catch (error) {
      console.warn(`⚠️ Failed to set ${aiProvider} as default, falling back to first available`);
      // Fallback to first available provider
      const availableProviders = aiEngine.listProviders();
      if (availableProviders.includes('ollama')) {
        aiEngine.setDefaultProvider('ollama');
      } else if (availableProviders.includes('openai')) {
        aiEngine.setDefaultProvider('openai');
      } else {
        throw new Error('No AI providers configured. Please check your .env file.');
      }
    }

    const actionEngine = new ActionEngine(
      automation.getBrowserManager(),
      aiEngine
    );

    // Create a new page to start with
    await automation.getBrowserManager().createPage();

    console.log('🚀 Starting automation tasks with live visualization...');

    // 4. First navigate to a page (this will be a separate session)
    console.log(`\n📋 Step 1: Navigating to page...`);
    try {
      await actionEngine.executeTask("go to https://aymen.co");
      console.log('✅ Navigation completed');
    } catch (error) {
      console.error('❌ Navigation failed:', error);
    }

    // Wait a moment between sessions
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 5. Execute a multi-step task to demonstrate the visualization
    // Using a task that won't trigger navigation-aware splitting
    const combinedInstruction = "Take a screenshot, then scroll down by 500 pixels, then wait for 1 second, then take another screenshot, then scroll up by 200 pixels";

    console.log(`\n📋 Step 2: Executing multi-step task: ${combinedInstruction}`);
    
    try {
      const result = await actionEngine.executeTask(combinedInstruction);
      console.log(`${result.success ? '✅' : '❌'} Multi-step task completed`);
    } catch (error) {
      console.error(`❌ Multi-step task failed:`, error);
    }

    console.log('\n🎉 All tasks completed! Check the visualization for the full execution flow.');

    // Cleanup
    await automation.close();

  } catch (error) {
    console.error('❌ Demonstration failed:', error);
  } finally {
    // Keep server running for a bit so user can see final results
    console.log('\n📺 Visualization server will stop in 5 seconds...');
    setTimeout(async () => {
      await visualizationServer.stop();
      console.log('👋 Demonstration complete!');
      process.exit(0);
    }, 5000);
  }
}

/**
 * Web Integration Example HTML
 * This shows how to embed the visualization in your own web page
 */
function generateWebIntegrationExample(): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My App with Browser Automation</title>
</head>
<body>
    <h1>My Application</h1>
    <p>This is my web application with integrated browser automation visualization.</p>

    <!-- Embedded automation visualization -->
    <div id="automation-dashboard" style="margin: 20px 0;">
        <h2>🤖 Live Browser Automation</h2>
        <div id="automation-viewer"></div>
    </div>

    <script>
        // Simple JavaScript to embed the automation visualization
        class AutomationDashboard {
            constructor(containerId) {
                this.container = document.getElementById(containerId);
                this.setupVisualization();
            }

            setupVisualization() {
                // Create iframe to embed the visualization
                const iframe = document.createElement('iframe');
                iframe.src = 'http://localhost:3002/demo';
                iframe.style.width = '100%';
                iframe.style.height = '600px';
                iframe.style.border = '1px solid #ccc';
                iframe.style.borderRadius = '8px';

                this.container.appendChild(iframe);

                // Alternatively, you can use the REST API for custom integration
                this.monitorExecution();
            }

            async monitorExecution() {
                try {
                    const response = await fetch('http://localhost:3002/api/execution/status');
                    const data = await response.json();

                    console.log('Current execution status:', data);

                    // Use the data to build your own custom visualization
                    // data.data contains: sessionId, isActive, totalEvents, connectedClients, lastEvent

                } catch (error) {
                    console.warn('Could not fetch execution status:', error);
                }
            }
        }

        // Initialize the dashboard when page loads
        document.addEventListener('DOMContentLoaded', () => {
            new AutomationDashboard('automation-viewer');
        });
    </script>
</body>
</html>
  `;
}

// Export the integration example HTML
console.log('💡 Web Integration Example:');
console.log('Save this HTML to a file and open it to see how to embed automation visualization:');
console.log('\n' + generateWebIntegrationExample());

// Run the demonstration
if (require.main === module) {
  demonstrateVisualization().catch(error => {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  });
}
