import { loadEnvironmentConfig } from '@theagent/core/dist/config/environment';
import { AutomationApiServer } from './api-server';

/**
 * Main server startup script
 * Loads environment configuration and starts the automation API server
 */
async function startServer() {
  console.log('🚀 Starting Automation API Server');

  // Load environment configuration first
  loadEnvironmentConfig();
  console.log('📋 Environment configuration loaded');

  // Get port from environment or use default
  const PORT = process.env.PORT || 3002;

  // Initialize automation API server
  const automationApiServer = new AutomationApiServer(Number(PORT));

  try {
    await automationApiServer.start();
    console.log(`✅ API Server running on http://localhost:${PORT}`);
    return automationApiServer;
  } catch (error) {
    console.error('❌ Failed to start API server:', error);
    process.exit(1);
  }
}

// Graceful shutdown handler
let serverInstance: AutomationApiServer | null = null;

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down API server...');
  if (serverInstance) {
    await serverInstance.stop();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down API server...');
  if (serverInstance) {
    await serverInstance.stop();
  }
  process.exit(0);
});

// Start the server
startServer()
  .then((server) => {
    serverInstance = server;
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
