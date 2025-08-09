import { Request, Response } from 'express';
import { executionStream } from '@theagent/core/dist/streaming/execution-stream';
import { HealthCheckResponse } from '../types';

/**
 * Controller for health check endpoint
 */
export class HealthController {
    /**
     * Health check endpoint
     */
    static checkHealth(req: Request, res: Response): void {
        const response: HealthCheckResponse = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            activeClients: executionStream.getExecutionStatus().connectedClients
        };
        res.json(response);
    }
}
