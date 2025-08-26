import { Request, Response } from 'express';
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

            const taskId = await automationService.executeTask(taskDescription, engine, aiProvider, options);

            const response: ApiResponse = {
                success: true,
                message: 'Execution completed',
                taskId: taskId,
                timestamp: new Date().toISOString()
            };
            res.json(response);

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

    /**
     * Export execution plan as JSON
     */
    static async exportLastExecution(req: Request, res: Response): Promise<void> {
        try {
            const taskId = req.query.taskId as string | undefined;

            if (!automationService.hasExportData(taskId)) {
                const message = taskId
                    ? `No execution data available for task ${taskId}.`
                    : 'No execution data available for export. Execute a task first.';

                const response: ApiResponse = {
                    success: false,
                    error: message
                };
                res.status(404).json(response);
                return;
            }

            const exportJson = taskId
                ? automationService.getTaskExport(taskId)
                : automationService.getLastTaskExport();

            if (!exportJson) {
                const response: ApiResponse = {
                    success: false,
                    error: 'Failed to generate export data'
                };
                res.status(500).json(response);
                return;
            }

            const exportData = JSON.parse(exportJson);
            const response: ApiResponse<any> = {
                success: true,
                data: exportData
            };
            res.json(response);

        } catch (error) {
            console.error('Export error:', error);
            const response: ApiResponse = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
            res.status(500).json(response);
        }
    }

    /**
     * Get current execution status
     */
    static async getExecutionStatus(req: Request, res: Response): Promise<void> {
        try {
            const status = automationService.getExecutionStatus();

            const response: ApiResponse<any> = {
                success: true,
                data: status
            };
            res.json(response);

        } catch (error) {
            console.error('Status error:', error);
            const response: ApiResponse = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
            res.status(500).json(response);
        }
    }
}
