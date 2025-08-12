import { BrowserAutomation } from '@theagent/core/dist/index';
import { executionStream } from '@theagent/core/dist/streaming/execution-stream';
import { BrowserType } from '@theagent/core/dist/types';
import { v4 as uuidv4 } from 'uuid';
import { ExecutionEvent, ExecutionStreamWithClients } from '../types';
import { configService } from './config.service';

/**
 * Service for handling browser automation tasks
 */
export class AutomationService {
    /**
     * Execute automation task and stream events
     */
    async executeTask(taskDescription: string, engine: string = 'playwright', aiProvider?: string, options: Record<string, unknown> = {}): Promise<void> {
        const sessionId = uuidv4();

        // Configure automation with the specified engine
        const automationConfig = {
            adapter: engine,
            browserType: BrowserType.CHROMIUM,
            headless: false, // Show browser for UI
            viewport: { width: 1280, height: 720 },
            ...options,
            ai: configService.getAIConfig(aiProvider) // Pass AI provider
        };

        // Create new automation instance with config
        const automation = new BrowserAutomation(automationConfig);

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
     * Broadcast custom events to all connected clients
     */
    private broadcastCustomEvent(event: ExecutionEvent): void {
        // Get all connected clients via reflection (accessing private property)
        const streamWithClients = executionStream as unknown as ExecutionStreamWithClients;
        const clients = streamWithClients.clients;
        if (clients) {
            clients.forEach((client) => {
                try {
                    client.response.write(`data: ${JSON.stringify(event)}\n\n`);
                } catch (error) {
                    console.error('Failed to send event to client:', error);
                }
            });
        }
    }
}

// Singleton instance
export const automationService = new AutomationService();
