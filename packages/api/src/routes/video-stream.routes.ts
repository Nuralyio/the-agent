import { Router } from 'express';
import { videoStreamController } from '../controllers/video-stream.controller';

const router = Router();

/**
 * POST /api/video-stream/start
 * Start video streaming
 */
router.post('/start', async (req, res) => {
  await videoStreamController.startStream(req, res);
});

/**
 * POST /api/video-stream/stop
 * Stop video streaming
 */
router.post('/stop', async (req, res) => {
  await videoStreamController.stopStream(req, res);
});

/**
 * GET /api/video-stream/status
 * Get streaming status
 */
router.get('/status', async (req, res) => {
  await videoStreamController.getStreamStatus(req, res);
});

/**
 * GET /api/video-stream/clients
 * Get all connected clients
 */
router.get('/clients', async (req, res) => {
  await videoStreamController.getClients(req, res);
});

/**
 * GET /api/video-stream/metrics
 * Get performance metrics for all clients
 */
router.get('/metrics', async (req, res) => {
  await videoStreamController.getPerformanceMetrics(req, res);
});

/**
 * GET /api/video-stream/metrics/:clientId
 * Get performance metrics for a specific client
 */
router.get('/metrics/:clientId', async (req, res) => {
  await videoStreamController.getClientMetrics(req, res);
});

export { router as videoStreamRoutes };
