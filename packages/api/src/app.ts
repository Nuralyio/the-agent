import express from 'express';
import { Server } from 'http';
import { createApp } from './utils/app.utils';
import { videoStreamController } from './controllers/video-stream.controller';
import { v4 as uuidv4 } from 'uuid';
import { WebSocketServer } from 'ws';

/**
 * AutomationApiServer - HTTP server with WebSocket support for video streaming
 * Restructured for better maintainability and separation of concerns
 */
export class AutomationApiServer {
    private app: express.Application;
    private server: Server | null = null;
    private wss: any | null = null;
    private port: number;

    constructor(port: number = 3002) {
        this.port = port;
        this.app = createApp();
    }

    /**
     * Start the monitor server with WebSocket support
     */
    async start(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.server = this.app.listen(this.port, () => {
                console.log(`🌐 Monitor server running on http://localhost:${this.port}`);
                console.log(`📡 Stream endpoint: http://localhost:${this.port}/api/execution/stream`);
                console.log(`🔧 API endpoints: /api/automation/execute, /api/automation/engines`);
                console.log(`📹 Video stream: ws://localhost:${this.port}/video-stream`);
                
                // Set up WebSocket server
                this.setupWebSocket();
                
                resolve();
            }).on('error', reject);
        });
    }

    /**
     * Set up WebSocket server for video streaming
     */
    private setupWebSocket(): void {
        if (!this.server) return;

        this.wss = new WebSocketServer({ 
            server: this.server,
            path: '/video-stream'
        });

        this.wss.on('connection', (ws: any, req: any) => {
            const clientId = uuidv4();
            const sessionId = req.headers['x-session-id'] as string;
            
            console.log(`📹 New video stream client connected: ${clientId}`);
            
            // Add client to video streaming service
            const videoService = videoStreamController.getVideoService();
            videoService.addClient(clientId, ws, sessionId);

            ws.on('message', async (message: any) => {
                try {
                    const data = JSON.parse(message.toString());
                    await this.handleWebSocketMessage(clientId, data, videoService);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Invalid message format'
                    }));
                }
            });

            ws.on('close', () => {
                console.log(`📹 Video stream client disconnected: ${clientId}`);
                videoService.removeClient(clientId);
            });

            ws.on('error', (error: any) => {
                console.error(`WebSocket error for client ${clientId}:`, error);
                videoService.removeClient(clientId);
            });
        });

        console.log('📹 WebSocket server initialized for video streaming');
    }

    /**
     * Handle WebSocket messages from clients
     */
    private async handleWebSocketMessage(clientId: string, data: any, videoService: any): Promise<void> {
        try {
            switch (data.type) {
                case 'start_stream':
                    await videoService.startVideoStream(clientId, data.options || {});
                    break;
                case 'stop_stream':
                    videoService.stopVideoStream(clientId);
                    break;
                case 'toggle_interactive':
                    if (data.enabled !== undefined) {
                        await videoService.toggleInteractiveMode(clientId, data.enabled);
                    }
                    break;
                case 'click_event':
                    if (data.x !== undefined && data.y !== undefined) {
                        await videoService.handleClickEvent(clientId, data.x, data.y);
                    }
                    break;
                case 'keyboard_event':
                    if (data.text) {
                        videoService.handleKeyboardEvent(clientId, data.text);
                    }
                    break;
                case 'ping':
                    videoService.sendMessage(clientId, { type: 'pong', timestamp: Date.now() });
                    break;
                default:
                    console.warn(`Unknown WebSocket message type: ${data.type}`);
            }
        } catch (error) {
            console.error(`Error handling WebSocket message from ${clientId}:`, error);
        }
    }

    /**
     * Stop the monitor server
     */
    async stop(): Promise<void> {
        return new Promise((resolve) => {
            // Clean up WebSocket connections
            if (this.wss) {
                const videoService = videoStreamController.getVideoService();
                videoService.cleanup();
                this.wss.close();
                this.wss = null;
            }

            if (this.server) {
                this.server.close(() => {
                    console.log(`🛑 Monitor server stopped`);
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

    /**
     * Get the WebSocket URL for video streaming
     */
    getWebSocketUrl(): string {
        return `ws://localhost:${this.port}/video-stream`;
    }
}

// Global singleton instance
export const automationApiServer = new AutomationApiServer();
