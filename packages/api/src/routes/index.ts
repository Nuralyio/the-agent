import { Router } from 'express';
import automationRoutes from './automation.routes';
import executionRoutes from './execution.routes';
import healthRoutes from './health.routes';
import { videoStreamRoutes } from './video-stream.routes';

const router = Router();

// API routes
router.use('/api/execution', executionRoutes);
router.use('/api/automation', automationRoutes);
router.use('/api/video-stream', videoStreamRoutes);
router.use('/health', healthRoutes);

export default router;
