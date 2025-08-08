import { Router } from 'express';
import { HealthController } from '../controllers/health.controller';

const router = Router();

// Health check endpoint
router.get('/', HealthController.checkHealth);

export default router;
