import { EventEmitter } from 'events';
import { ActionStep } from '../types';

export interface ExecutionEvent {
  type: 'plan_created' | 'step_start' | 'step_complete' | 'step_error' | 'screenshot' | 'page_change' | 'execution_complete';
  stepIndex?: number;
  step?: ActionStep;
  steps?: ActionStep[];
  totalSteps?: number;
  screenshot?: string; // Base64 encoded
  url?: string;
  title?: string;
  error?: string;
  timestamp: Date;
  sessionId: string;
}

export interface StreamClient {
  id: string;
  response: any; // HTTP response object
  lastPing: Date;
}

/**
 * ExecutionStream - Provides real-time execution visualization for web integration
 */
export class ExecutionStream extends EventEmitter {
  private clients: Map<string, StreamClient> = new Map();
  private currentSessionId: string | null = null;
  private executionHistory: ExecutionEvent[] = [];

  constructor() {
    super();
    this.setupCleanupInterval();
  }

  /**
   * Start a new execution session
   */
  startSession(sessionId: string): void {
    this.currentSessionId = sessionId;
    this.executionHistory = [];

    this.broadcastEvent({
      type: 'execution_complete', // Reset event
      sessionId,
      timestamp: new Date()
    });
  }

  /**
   * Stream plan creation event with total step count and steps
   */
  streamPlanCreated(totalSteps: number, steps?: ActionStep[]): void {
    if (!this.currentSessionId) return;

    const event: ExecutionEvent = {
      type: 'plan_created',
      totalSteps,
      sessionId: this.currentSessionId,
      timestamp: new Date()
    };

    if (steps) {
      event.steps = steps;
    }

    this.executionHistory.push(event);
    this.broadcastEvent(event);
  }

  /**
   * Stream step start event
   */
  streamStepStart(stepIndex: number, step: ActionStep): void {
    if (!this.currentSessionId) return;

    const event: ExecutionEvent = {
      type: 'step_start',
      stepIndex,
      step,
      sessionId: this.currentSessionId,
      timestamp: new Date()
    };

    this.executionHistory.push(event);
    this.broadcastEvent(event);
  }

  /**
   * Stream step completion with screenshot
   */
  streamStepComplete(stepIndex: number, step: ActionStep, screenshot?: Buffer): void {
    if (!this.currentSessionId) return;

    const event: ExecutionEvent = {
      type: 'step_complete',
      stepIndex,
      step,
      sessionId: this.currentSessionId,
      timestamp: new Date()
    };

    if (screenshot) {
      event.screenshot = screenshot.toString('base64');
    }

    this.executionHistory.push(event);
    this.broadcastEvent(event);
  }

  /**
   * Stream step error
   */
  streamStepError(stepIndex: number, step: ActionStep, error: string): void {
    if (!this.currentSessionId) return;

    const event: ExecutionEvent = {
      type: 'step_error',
      stepIndex,
      step,
      error,
      sessionId: this.currentSessionId,
      timestamp: new Date()
    };

    this.executionHistory.push(event);
    this.broadcastEvent(event);
  }

  /**
   * Stream page change event
   */
  streamPageChange(url: string, title: string, screenshot?: Buffer): void {
    if (!this.currentSessionId) return;

    const event: ExecutionEvent = {
      type: 'page_change',
      url,
      title,
      sessionId: this.currentSessionId,
      timestamp: new Date()
    };

    if (screenshot) {
      event.screenshot = screenshot.toString('base64');
    }

    this.executionHistory.push(event);
    this.broadcastEvent(event);
  }

  /**
   * Stream execution completion
   */
  streamExecutionComplete(): void {
    if (!this.currentSessionId) return;

    const event: ExecutionEvent = {
      type: 'execution_complete',
      sessionId: this.currentSessionId,
      timestamp: new Date()
    };

    this.executionHistory.push(event);
    this.broadcastEvent(event);
  }

  /**
   * Add a new SSE client
   */
  addClient(clientId: string, response: any): void {
    console.log(`📺 New visualization client connected: ${clientId}`);

    this.clients.set(clientId, {
      id: clientId,
      response,
      lastPing: new Date()
    });

    // Send connection confirmation
    this.sendToClient(clientId, {
      type: 'connection',
      data: { connected: true, clientId }
    });

    // Send execution history if available
    if (this.executionHistory.length > 0) {
      this.sendToClient(clientId, {
        type: 'history',
        data: this.executionHistory
      });
    }
  }

  /**
   * Remove a client
   */
  removeClient(clientId: string): void {
    console.log(`📺 Visualization client disconnected: ${clientId}`);
    this.clients.delete(clientId);
  }

  /**
   * Get current execution status for REST API
   */
  getExecutionStatus(): {
    sessionId: string | null;
    isActive: boolean;
    totalEvents: number;
    connectedClients: number;
    lastEvent?: ExecutionEvent;
  } {
    const status = {
      sessionId: this.currentSessionId,
      isActive: this.currentSessionId !== null,
      totalEvents: this.executionHistory.length,
      connectedClients: this.clients.size
    };

    const lastEvent = this.executionHistory[this.executionHistory.length - 1];
    if (lastEvent) {
      return { ...status, lastEvent };
    }

    return status;
  }

  /**
   * Get execution history for REST API
   */
  getExecutionHistory(): ExecutionEvent[] {
    return [...this.executionHistory];
  }

  private broadcastEvent(event: ExecutionEvent): void {
    const message = {
      type: 'execution_event',
      data: event
    };

    this.clients.forEach((client, clientId) => {
      this.sendToClient(clientId, message);
    });
  }

  private sendToClient(clientId: string, message: any): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      client.response.write(`data: ${JSON.stringify(message)}\n\n`);
      client.lastPing = new Date();
    } catch (error) {
      console.warn(`📺 Failed to send to client ${clientId}:`, error);
      this.removeClient(clientId);
    }
  }

  private setupCleanupInterval(): void {
    // Clean up dead connections every 30 seconds
    setInterval(() => {
      const now = new Date();
      const timeout = 60000; // 1 minute timeout

      this.clients.forEach((client, clientId) => {
        if (now.getTime() - client.lastPing.getTime() > timeout) {
          console.log(`📺 Cleaning up stale client: ${clientId}`);
          this.removeClient(clientId);
        }
      });
    }, 30000);
  }
}

// Global singleton instance
export const executionStream = new ExecutionStream();
