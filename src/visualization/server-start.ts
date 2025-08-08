import { loadEnvironmentConfig, logConfigurationStatus } from '../config/environment';
import { visualizationServer } from './visualization-server';

/**
 * Visualization Server Startup Script
 * Properly loads environment configuration and starts the server
 */
async function startVisualizationServer() {
  console.log('🚀 Starting Visualization Server with Environment Configuration');
  
  // Load configuration from environment variables (.env file)
  const envConfig = loadEnvironmentConfig();
  logConfigurationStatus(envConfig);

  // Start the visualization server
  try {
    await visualizationServer.start();
    console.log('✅ Visualization server started successfully');
  } catch (error) {
    console.error('❌ Failed to start visualization server:', error);
    process.exit(1);
  }
}

// Start the server
startVisualizationServer().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
