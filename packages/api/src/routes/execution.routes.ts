import { Router } from 'express';
import { ExecutionController } from '../controllers/execution.controller';

const router = Router();

// Server-Sent Events endpoint for real-time streaming
router.get('/stream', ExecutionController.streamExecution);

// REST API for execution status
router.get('/status', ExecutionController.getExecutionStatus);

// REST API for execution history
router.get('/history', ExecutionController.getExecutionHistory);

export default router;
