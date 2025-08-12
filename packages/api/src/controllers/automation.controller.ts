import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { automationService } from '../services/automation.service';
import { AutomationExecuteRequest, ApiResponse } from '../types';

/**
 * Controller for automation endpoints
 */
export class AutomationController {
    /**
     * Execute automation task
     */
    static async executeTask(req: Request, res: Response): Promise<void> {
        try {
            const { taskDescription, engine = 'playwright', aiProvider, options = {} }: AutomationExecuteRequest = req.body;

            if (!taskDescription) {
                const response: ApiResponse = {
                    success: false,
                    error: 'Task description is required'
                };
                res.status(400).json(response);
                return;
            }

            // Send initial response
            const response: ApiResponse = {
                success: true,
                message: 'Execution started',
                taskId: uuidv4(),
                timestamp: new Date().toISOString()
            };
            res.json(response);

            // Execute automation in background and stream events
            automationService.executeTask(taskDescription, engine, aiProvider, options)
                .catch(error => {
                    console.error('Background automation execution error:', error);
                });

        } catch (error) {
            console.error('Automation execution error:', error);
            const response: ApiResponse = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
            res.status(500).json(response);
        }
    }

    /**
     * Get available automation engines
     */
    static getEngines(req: Request, res: Response): void {
        const engines = automationService.getAvailableEngines();
        const response: ApiResponse<string[]> = {
            success: true,
            data: engines
        };
        res.json(response);
    }
}
