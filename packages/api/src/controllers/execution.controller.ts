import { executionStream } from '@theagent/core';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ApiResponse } from '../types';

/**
 * Controller for execution streaming endpoints
 */
export class ExecutionController {
    /**
     * Server-Sent Events endpoint for real-time streaming
     */
    static streamExecution(req: Request, res: Response): void {
        const clientId = uuidv4();

        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control'
        });

        // Add client to stream
        executionStream.addClient(clientId, res);

        // Handle client disconnect
        req.on('close', () => {
            executionStream.removeClient(clientId);
        });

        req.on('aborted', () => {
            executionStream.removeClient(clientId);
        });
    }

    /**
     * Get execution status
     */
    static getExecutionStatus(req: Request, res: Response): void {
        const status = executionStream.getExecutionStatus();
        const response: ApiResponse = {
            success: true,
            data: status
        };
        res.json(response);
    }

    /**
     * Get execution history
     */
    static getExecutionHistory(req: Request, res: Response): void {
        const history = executionStream.getExecutionHistory();
        const response: ApiResponse = {
            success: true,
            data: history
        };
        res.json(response);
    }
}
