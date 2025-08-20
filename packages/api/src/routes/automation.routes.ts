import { Router } from 'express';
import { AutomationController } from '../controllers/automation.controller';

const router = Router();

// Execute automation task
router.post('/execute', AutomationController.executeTask);

// Get available automation engines
router.get('/engines', AutomationController.getEngines);

// Get current screenshot for live streaming
router.get('/screenshot', AutomationController.getScreenshot);

export default router;
