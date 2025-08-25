import { Router } from 'express';
import { AutomationController } from '../controllers/automation.controller';

const router = Router();

router.post('/execute', AutomationController.executeTask);

router.get('/engines', AutomationController.getEngines);

router.get('/screenshot', AutomationController.getScreenshot);

router.get('/export', AutomationController.exportLastExecution);

export default router;
