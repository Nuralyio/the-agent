import { setPauseChecker } from '@theagent/core/dist/engine/execution/action-sequence-executor';
import { TheAgent } from '@theagent/core/dist/index';
import { executionStream } from '@theagent/core/dist/streaming/execution-stream';
import { BrowserType } from '@theagent/core/dist/types';
import { v4 as uuidv4 } from 'uuid';
import { ExecutionEvent } from '../types';
import { configService } from './config.service';

/**
 * Service for handling browser automation tasks
 */
export class AutomationService {
    private currentAutomation: TheAgent | null = null;
    private isPaused: boolean = false;
    private pauseResolver: (() => void) | null = null;
    private static instance: AutomationService | null = null;

    constructor() {
        // Store reference for global pause checking
        AutomationService.instance = this;

        // Set up the pause checker for the core execution engine
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
    async executeTask(taskDescription: string, engine: string = 'playwright', aiProvider?: string, options: Record<string, unknown> = {}): Promise<void> {
        const sessionId = uuidv4();

        // Configure automation with the specified engine
        const automationConfig = {
            adapter: engine,
            browserType: BrowserType.CHROMIUM,
            viewport: { width: 1280, height: 720 },
            ...options, // Apply options first so they can be overridden
            ai: configService.getAIConfig(aiProvider) // Pass AI provider
        };

        // Create new automation instance with config
        const automation = new TheAgent(automationConfig);
        this.currentAutomation = automation;

        try {
            // Initialize automation
            await automation.initialize();

            // Start session
            executionStream.startSession(sessionId);

            // Stream start event
            this.broadcastCustomEvent({
                type: 'execution_start',
                sessionId,
                timestamp: new Date().toISOString(),
                task: taskDescription
            });

            // Execute the actual automation using the smart executeTask method
            const result = await automation.executeTask(taskDescription);

            // Stream execution complete
            executionStream.streamExecutionComplete();

            // Broadcast custom completion event with result
            this.broadcastCustomEvent({
                type: 'execution_complete',
                timestamp: new Date().toISOString(),
                result: result,
                status: 'success'
            });

        } catch (error) {
            // Stream execution error
            this.broadcastCustomEvent({
                type: 'execution_error',
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error',
                status: 'error'
            });
            throw error;
        } finally {
            // Clean up automation
            try {
                await automation.close();
                this.currentAutomation = null;
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
     */
    getCurrentAutomation(): TheAgent | null {
        return this.currentAutomation;
    }

    /**
     * Pause the current automation execution
     */
    pauseExecution(): void {
        if (!this.isPaused) {
            this.isPaused = true;
            console.log('⏸️ Automation execution paused for interactive mode');

            // Broadcast pause event
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

            // Resolve the pause promise if waiting
            if (this.pauseResolver) {
                this.pauseResolver();
                this.pauseResolver = null;
            }

            // Broadcast resume event
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
    async getCurrentScreenshot(options?: { quality?: number; format?: 'png' | 'jpeg'; fullPage?: boolean }): Promise<Buffer | null> {
        if (!this.currentAutomation) {
            return null;
        }

        try {
            // Get the current page from the browser manager
            const browserManager = this.currentAutomation.getBrowserManager();
            const currentPage = await browserManager.getCurrentPage();

            if (!currentPage) {
                return null;
            }

            // Take screenshot with optimized options for performance
            const screenshotOptions = {
                fullPage: options?.fullPage || false,
                type: options?.format || 'jpeg',
                quality: options?.quality || 70 // Lower quality for better performance
            };

            return await currentPage.screenshot(screenshotOptions);
        } catch (error) {
            console.error('Error taking screenshot:', error);
            return null;
        }
    }

    /**
     * Start video recording for current automation session
     */
    async startVideoRecording(): Promise<void> {
        if (!this.currentAutomation) {
            throw new Error('No active automation session');
        }

        try {
            const browserManager = this.currentAutomation.getBrowserManager();
            const currentPage = await browserManager.getCurrentPage();

            if (!currentPage) {
                throw new Error('No active page found');
            }

            // Check if page supports video recording
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
    async stopVideoRecording(): Promise<string | null> {
        if (!this.currentAutomation) {
            return null;
        }

        try {
            const browserManager = this.currentAutomation.getBrowserManager();
            const currentPage = await browserManager.getCurrentPage();

            if (!currentPage) {
                return null;
            }

            // Check if page supports video recording
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
    async isVideoRecording(): Promise<boolean> {
        if (!this.currentAutomation) {
            return false;
        }

        try {
            const browserManager = this.currentAutomation.getBrowserManager();
            const currentPage = await browserManager.getCurrentPage();

            if (!currentPage) {
                return false;
            }

            // Check if page supports video recording status check
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
     * Broadcast custom events to all connected clients
     */
    private broadcastCustomEvent(event: ExecutionEvent): void {
        // Use the execution stream's proper broadcasting mechanism
        const streamEvent = {
            type: event.type,
            sessionId: event.sessionId || 'default',
            timestamp: new Date(),
            data: event
        };

        // Use the internal broadcast method from execution stream
        (executionStream as any).broadcastEvent(streamEvent);
    }
}

// Singleton instance
export const automationService = new AutomationService();
