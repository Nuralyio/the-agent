import { Router } from 'express';
import { AutomationController } from '../controllers/automation.controller';

const router = Router();

// Execute automation task
router.post('/execute', AutomationController.executeTask);

// Get available automation engines
router.get('/engines', AutomationController.getEngines);

export default router;
