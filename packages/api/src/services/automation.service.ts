import { setPauseChecker } from '@theagent/core/dist/engine/execution/action-sequence-executor';
import { executionStream, TheAgent } from '@theagent/core/dist/index';
import { BrowserType } from '@theagent/core/dist/types';
import { ExecutionPlanExporter } from '@theagent/core/dist/utils/execution-plan-exporter';
import { v4 as uuidv4 } from 'uuid';
import { ExecutionEvent } from '../types';
import { configService } from './config.service';

/**
 * Service for handling browser automation tasks
 */
export class AutomationService {
    private runningTasks: Map<string, TheAgent> = new Map(); // Track multiple running tasks by ID
    private taskResults: Map<string, any> = new Map(); // Store task results by ID
    private isPaused: boolean = false;
    private pauseResolver: (() => void) | null = null;
    private static instance: AutomationService | null = null;

    constructor() {
        AutomationService.instance = this;

        setPauseChecker(async () => {
            await this.waitForResume();
        });
    }

    /**
     * Get singleton instance for global pause checking
     */
    static getInstance(): AutomationService | null {
        return AutomationService.instance;
    }

    /**
     * Execute automation task and stream events
     */
    async executeTask(taskDescription: string, engine: string = 'playwright', aiProvider?: string, options: Record<string, unknown> = {}): Promise<string> {
        const taskId = uuidv4();
        const sessionId = uuidv4();

        const automationConfig = {
            adapter: engine,
            browserType: BrowserType.CHROMIUM,
            viewport: { width: 1280, height: 720 },
            ...options,
            ai: configService.getAIConfig(aiProvider)
        };

        const automation = new TheAgent(automationConfig);
        this.runningTasks.set(taskId, automation);

        try {
            await automation.initialize();

            executionStream.startSession(sessionId);

            this.broadcastCustomEvent({
                type: 'execution_start',
                sessionId,
                timestamp: new Date().toISOString(),
                task: taskDescription,
                taskId: taskId
            });

            const result = await automation.executeTask(taskDescription);

            this.taskResults.set(taskId, result);

            executionStream.notifyExecutionComplete();

            this.broadcastCustomEvent({
                type: 'execution_complete',
                timestamp: new Date().toISOString(),
                result: result,
                status: 'success',
                taskId: taskId
            });

            return taskId;

        } catch (error) {
            this.broadcastCustomEvent({
                type: 'execution_error',
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error',
                status: 'error',
                taskId: taskId
            });
            throw error;
        } finally {
            try {
                await automation.close();
                this.runningTasks.delete(taskId);
            } catch (cleanupError) {
                console.error('Cleanup error:', cleanupError);
            }
        }
    }

    /**
     * Get available automation engines
     */
    getAvailableEngines(): string[] {
        return ['playwright', 'puppeteer', 'selenium'];
    }

    /**
     * Get current automation instance (for video streaming service)
     * Returns the first running task if multiple tasks are running
     */
    getCurrentAutomation(): TheAgent | null {
        const runningTasks = Array.from(this.runningTasks.values());
        return runningTasks.length > 0 ? runningTasks[0] : null;
    }

    /**
     * Get automation instance by task ID
     */
    getAutomationByTaskId(taskId: string): TheAgent | null {
        return this.runningTasks.get(taskId) || null;
    }

    /**
     * Pause the current automation execution
     */
    pauseExecution(): void {
        if (!this.isPaused) {
            this.isPaused = true;
            console.log('⏸️ Automation execution paused for interactive mode');

            this.broadcastCustomEvent({
                type: 'execution_paused',
                timestamp: new Date().toISOString(),
                status: 'paused'
            });
        }
    }

    /**
     * Resume the paused automation execution
     */
    resumeExecution(): void {
        if (this.isPaused) {
            this.isPaused = false;
            console.log('▶️ Automation execution resumed');

            if (this.pauseResolver) {
                this.pauseResolver();
                this.pauseResolver = null;
            }

            this.broadcastCustomEvent({
                type: 'execution_resumed',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Check if automation is currently paused
     */
    isPausedExecution(): boolean {
        return this.isPaused;
    }

    /**
     * Check if any task is currently running
     */
    isTaskRunning(): boolean {
        return this.runningTasks.size > 0;
    }

    /**
     * Check if a specific task is running
     */
    isTaskRunningById(taskId: string): boolean {
        return this.runningTasks.has(taskId);
    }

    /**
     * Get current execution status
     */
    getExecutionStatus(): { isRunning: boolean; isPaused: boolean; hasTaskResult: boolean; runningTaskCount: number; taskIds: string[] } {
        const taskIds = Array.from(this.runningTasks.keys());
        return {
            isRunning: this.isTaskRunning(),
            isPaused: this.isPausedExecution(),
            hasTaskResult: this.taskResults.size > 0,
            runningTaskCount: this.runningTasks.size,
            taskIds
        };
    }

    /**
     * Wait for resume if execution is paused (for use in automation tasks)
     */
    async waitForResume(): Promise<void> {
        if (this.isPaused) {
            return new Promise<void>((resolve) => {
                this.pauseResolver = resolve;
            });
        }
    }

    /**
     * Get current screenshot from active automation instance
     */
    async getCurrentScreenshot(options?: { quality?: number; format?: 'png' | 'jpeg'; fullPage?: boolean; taskId?: string }): Promise<Buffer | null> {
        const automation = options?.taskId ? this.getAutomationByTaskId(options.taskId) : this.getCurrentAutomation();

        if (!automation) {
            return null;
        }

        try {
            // Getthe current page from the browser manager
            const browserManager = automation.getBrowserManager();
            const currentPage = await browserManager.getCurrentPage();

            if (!currentPage) {
                return null;
            }

            const screenshotOptions = {
                fullPage: options?.fullPage || false,
                type: options?.format || 'jpeg',
                quality: options?.quality || 70
            };

            const screenshot = await currentPage.screenshot(screenshotOptions);
            return screenshot;
        } catch (error) {
            console.error('❌ Error taking screenshot:', error);
            return null;
        }
    }
    /**
     * Start video recording for current automation session
     */
    async startVideoRecording(taskId?: string): Promise<void> {
        const automation = taskId ? this.getAutomationByTaskId(taskId) : this.getCurrentAutomation();

        if (!automation) {
            throw new Error('No active automation session');
        }

        try {
            const browserManager = automation.getBrowserManager();
            const currentPage = await browserManager.getCurrentPage();

            if (!currentPage) {
                throw new Error('No active page found');
            }

            if (typeof (currentPage as any).startVideoRecording === 'function') {
                await (currentPage as any).startVideoRecording({
                    dir: './videos',
                    size: { width: 1280, height: 720 }
                });
            } else {
                throw new Error('Video recording not supported by current page adapter');
            }
        } catch (error) {
            console.error('Error starting video recording:', error);
            throw error;
        }
    }

    /**
     * Stop video recording and return video path
     */
    async stopVideoRecording(taskId?: string): Promise<string | null> {
        const automation = taskId ? this.getAutomationByTaskId(taskId) : this.getCurrentAutomation();

        if (!automation) {
            return null;
        }

        try {
            const browserManager = automation.getBrowserManager();
            const currentPage = await browserManager.getCurrentPage();

            if (!currentPage) {
                return null;
            }

            if (typeof (currentPage as any).stopVideoRecording === 'function') {
                return await (currentPage as any).stopVideoRecording();
            } else {
                throw new Error('Video recording not supported by current page adapter');
            }
        } catch (error) {
            console.error('Error stopping video recording:', error);
            return null;
        }
    }

    /**
     * Check if video recording is active
     */
    async isVideoRecording(taskId?: string): Promise<boolean> {
        const automation = taskId ? this.getAutomationByTaskId(taskId) : this.getCurrentAutomation();

        if (!automation) {
            return false;
        }

        try {
            const browserManager = automation.getBrowserManager();
            const currentPage = await browserManager.getCurrentPage();

            if (!currentPage) {
                return false;
            }

            if (typeof (currentPage as any).isVideoRecording === 'function') {
                return await (currentPage as any).isVideoRecording();
            }

            return false;
        } catch (error) {
            console.error('Error checking video recording status:', error);
            return false;
        }
    }

    /**
     * Get export data for a specific task
     */
    getTaskExport(taskId: string): string | null {
        const taskResult = this.taskResults.get(taskId);
        
        if (!taskResult) {
            return null;
        }

        try {
            if (!taskResult.instruction) {
                throw new Error('Task result is missing the original instruction');
            }

            const exportData = ExecutionPlanExporter.exportFromTaskResult(
                taskResult,
                taskResult.instruction
            );

            return ExecutionPlanExporter.exportToJson(exportData, true);
        } catch (error) {
            console.error('Export error:', error);
            return null;
        }
    }

    /**
     * Get export data for the most recent completed task
     */
    getLastTaskExport(): string | null {
        const taskIds = Array.from(this.taskResults.keys());
        if (taskIds.length === 0) {
            return null;
        }
        
        // Get the most recent task result
        const lastTaskId = taskIds[taskIds.length - 1];
        return this.getTaskExport(lastTaskId);
    }

    /**
     * Check if export data is available for a specific task
     */
    hasExportData(taskId?: string): boolean {
        if (taskId) {
            return this.taskResults.has(taskId);
        }
        return this.taskResults.size > 0;
    }

    /**
     * Broadcast custom events to all connected clients
     */
    private broadcastCustomEvent(event: ExecutionEvent): void {
        const streamEvent = {
            type: event.type,
            sessionId: event.sessionId || 'default',
            timestamp: new Date(),
            data: event
        };

        (executionStream as any).broadcastEvent(streamEvent);
    }
}

export const automationService = new AutomationService();
