import express from 'express';
import cors from 'cors';
import { VisualizationServer } from './visualization/visualization-server';

const PORT = process.env.PORT || 3002;

// Initialize visualization server
const visualizationServer = new VisualizationServer(Number(PORT));

async function startServer() {
  try {
    await visualizationServer.start();
    console.log(`🚀 API Server running on http://localhost:${PORT}`);
  } catch (error) {
    console.error('❌ Failed to start API server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down API server...');
  await visualizationServer.stop();
  process.exit(0);
});

startServer();
