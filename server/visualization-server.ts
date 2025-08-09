import cors from 'cors';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createAIProviderConfigs, isProviderAvailable, loadEnvironmentConfig } from '../src/config/environment';
import { BrowserAutomation } from '../src/index';
import { AIConfig, BrowserType } from '../src/types';
import { executionStream } from './execution-stream';

/**
 * VisualizationServer - HTTP server for web-based execution visualization
 */
export class VisualizationServer {
    private app: express.Application;
    private server: any;
    private port: number;
    private automation: BrowserAutomation;
    private envConfig: any;

    constructor(port: number = 3002) {
        this.port = port;
        this.app = express();

        // Load environment configuration
        this.envConfig = loadEnvironmentConfig();

        // Get AI configuration
        const aiConfig = this.getAIConfig();

        // Configure automation with AI support from environment
        this.automation = new BrowserAutomation({
            headless: false,
            ...(aiConfig && { ai: aiConfig })
        });

        this.setupMiddleware();
        this.setupRoutes();
    }

    /**
     * Get AI configuration from environment
     */
    private getAIConfig(): AIConfig | undefined {
        console.log('🔍 Checking AI configuration...');
        console.log('Environment config:', {
            defaultProvider: this.envConfig.defaultProvider,
            ollamaBaseUrl: this.envConfig.ollama.baseUrl,
            ollamaModel: this.envConfig.ollama.model
        });

        // Check if the default provider is available
        if (!isProviderAvailable(this.envConfig.defaultProvider, this.envConfig)) {
            console.log('❌ Default AI provider not available:', this.envConfig.defaultProvider);
            return undefined;
        }

        // Create provider configs
        const providerConfigs = createAIProviderConfigs(this.envConfig);
        const defaultProviderConfig = providerConfigs[this.envConfig.defaultProvider];

        if (!defaultProviderConfig) {
            console.log('❌ No configuration found for default provider:', this.envConfig.defaultProvider);
            return undefined;
        }

        console.log('✅ AI configuration loaded successfully:', {
            provider: this.envConfig.defaultProvider,
            model: defaultProviderConfig.model,
            baseUrl: defaultProviderConfig.baseUrl
        });

        return {
            provider: 'ollama',
            ...defaultProviderConfig
        };
    } private setupMiddleware(): void {
        // Enable CORS for web integration
        this.app.use(cors({
            origin: '*',
            methods: ['GET', 'POST', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
            credentials: false
        }));

        this.app.use(express.json());
        this.app.use(express.static('public'));
    }

    private setupRoutes(): void {
        // Server-Sent Events endpoint for real-time streaming
        this.app.get('/api/execution/stream', (req, res) => {
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
        });

        // REST API for execution status
        this.app.get('/api/execution/status', (req, res) => {
            const status = executionStream.getExecutionStatus();
            res.json({
                success: true,
                data: status
            });
        });

        // REST API for execution history
        this.app.get('/api/execution/history', (req, res) => {
            const history = executionStream.getExecutionHistory();
            res.json({
                success: true,
                data: history
            });
        });

        // Automation execution endpoints
        this.app.post('/api/automation/execute', async (req, res): Promise<void> => {
            try {
                const { taskDescription, engine = 'playwright', options = {} } = req.body;

                if (!taskDescription) {
                    res.status(400).json({
                        success: false,
                        error: 'Task description is required'
                    });
                    return;
                }

                // Configure automation with the specified engine
                const automationConfig = {
                    adapter: engine,
                    browserType: BrowserType.CHROMIUM,
                    headless: false, // Show browser for UI
                    viewport: { width: 1280, height: 720 },
                    ...options,
                    ai: this.getAIConfig() // Add AI configuration
                };

                // Create new automation instance with config
                const automation = new BrowserAutomation(automationConfig);

                // Initialize automation
                await automation.initialize();

                // Send initial response
                res.json({
                    success: true,
                    message: 'Execution started',
                    taskId: uuidv4(),
                    timestamp: new Date().toISOString()
                });

                // Execute automation in background and stream events
                this.executeAutomationTask(automation, taskDescription);

            } catch (error) {
                console.error('Automation execution error:', error);
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });

        // Get automation engines
        this.app.get('/api/automation/engines', (req, res) => {
            res.json({
                success: true,
                data: ['playwright', 'puppeteer', 'selenium']
            });
        });

        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                activeClients: executionStream.getExecutionStatus().connectedClients
            });
        });
    }

    /**
     * Execute automation task and stream events
     */
    private async executeAutomationTask(automation: BrowserAutomation, taskDescription: string): Promise<void> {
        const sessionId = uuidv4();

        try {
            // Start session
            executionStream.startSession(sessionId);

            // Stream start event - using a custom method to broadcast general events
            this.broadcastCustomEvent({
                type: 'execution_start',
                sessionId,
                timestamp: new Date().toISOString(),
                task: taskDescription
            });

            // Execute the actual automation using the smart executeTask method (same as tests)
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
     * Broadcast custom events to all connected clients
     */
    private broadcastCustomEvent(event: any): void {
        // Get all connected clients via reflection (accessing private property)
        const clients = (executionStream as any).clients;
        if (clients) {
            clients.forEach((client: any) => {
                try {
                    client.response.write(`data: ${JSON.stringify(event)}\n\n`);
                } catch (error) {
                    console.error('Failed to send event to client:', error);
                }
            });
        }
    }

    /**
     * Start the visualization server
     */
    async start(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.server = this.app.listen(this.port, () => {
                console.log(`🌐 Visualization server running on http://localhost:${this.port}`);
                console.log(`� Stream endpoint: http://localhost:${this.port}/api/execution/stream`);
                console.log(`� API endpoints: /api/automation/execute, /api/automation/engines`);
                resolve();
            }).on('error', reject);
        });
    }

    /**
     * Stop the visualization server
     */
    async stop(): Promise<void> {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    console.log(`🛑 Visualization server stopped`);
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    /**
     * Get the server URL for integration
     */
    getServerUrl(): string {
        return `http://localhost:${this.port}`;
    }
}

// Global singleton instance
export const visualizationServer = new VisualizationServer();
