import { loadEnvironmentConfig } from '@theagent/core/src/environment';
import { AutomationApiServer } from './app';

/**
 * Main server startup script
 * Loads environment configuration and starts the automation API server
 */
async function startServer() {
  console.log('🚀 Starting Automation API Server');

  loadEnvironmentConfig();
  console.log('📋 Environment configuration loaded');

  const PORT = process.env.PORT || 3002;

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

startServer()
  .then((server) => {
    serverInstance = server;
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
