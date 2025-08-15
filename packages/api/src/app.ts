import express from 'express';
import { Server } from 'http';
import { createApp } from './utils/app.utils';

/**
 * AutomationApiServer - HTTP server for web-based execution monitor
 * Restructured for better maintainability and separation of concerns
 */
export class AutomationApiServer {
    private app: express.Application;
    private server: Server | null = null;
    private port: number;

    constructor(port: number = 3002) {
        this.port = port;
        this.app = createApp();
    }

    /**
     * Start the monitor server
     */
    async start(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.server = this.app.listen(this.port, () => {
                console.log(`🌐 Monitor server running on http://localhost:${this.port}`);
                console.log(`📡 Stream endpoint: http://localhost:${this.port}/api/execution/stream`);
                console.log(`🔧 API endpoints: /api/automation/execute, /api/automation/engines`);
                resolve();
            }).on('error', reject);
        });
    }

    /**
     * Stop the monitor server
     */
    async stop(): Promise<void> {
        return new Promise((resolve) => {
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
}

// Global singleton instance
export const automationApiServer = new AutomationApiServer();
