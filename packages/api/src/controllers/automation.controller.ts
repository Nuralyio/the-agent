import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { automationService } from '../services/automation.service';
import { ApiResponse, AutomationExecuteRequest } from '../types';

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

    /**
     * Get current browser screenshot for live streaming
     */
    static async getScreenshot(req: Request, res: Response): Promise<void> {
        try {
            const screenshot = await automationService.getCurrentScreenshot();

            if (screenshot) {
                res.setHeader('Content-Type', 'image/png');
                res.setHeader('Cache-Control', 'no-cache');
                res.send(screenshot);
            } else {
                res.status(404).json({
                    success: false,
                    error: 'No active browser session or screenshot available'
                });
            }
        } catch (error) {
            console.error('Screenshot error:', error);
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
