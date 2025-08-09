import { Router } from 'express';
import executionRoutes from './execution.routes';
import automationRoutes from './automation.routes';
import healthRoutes from './health.routes';

const router = Router();

// API routes
router.use('/api/execution', executionRoutes);
router.use('/api/automation', automationRoutes);
router.use('/health', healthRoutes);

export default router;
