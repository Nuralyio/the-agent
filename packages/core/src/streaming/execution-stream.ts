import { EventEmitter } from 'events';
import { ActionStep } from '../types';

export interface ExecutionEvent {
  type: 'plan_created' | 'hierarchical_plan_created' | 'sub_plan_start' | 'sub_plan_completed' | 'step_start' | 'step_complete' | 'step_error' | 'screenshot' | 'page_change' | 'execution_complete';
  stepIndex?: number;
  step?: ActionStep;
  steps?: ActionStep[];
  totalSteps?: number;
  screenshot?: string; // Base64 encoded
  url?: string;
  title?: string;
  error?: string;
  success?: boolean; // For sub-plan completion status
  timestamp: Date;
  sessionId: string;
  // Hierarchical plan specific fields
  hierarchicalPlan?: any;
  globalObjective?: string;
  planningStrategy?: string;
  // Sub-plan specific fields
  subPlanIndex?: number;
  subPlan?: any;
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
  private cleanupInterval?: NodeJS.Timeout;
  private currentSubPlanIndex: number | undefined = undefined;

  constructor() {
    super();
    // Only setup cleanup interval in non-test environments
    if (process.env.NODE_ENV !== 'test' && !process.env.JEST_WORKER_ID) {
      this.setupCleanupInterval();
    }
  }

    /**
   * Start a new execution session
   */
  startSession(sessionId: string): void {
    this.currentSessionId = sessionId;
    this.executionHistory = [];
    this.currentSubPlanIndex = undefined;

    this.broadcastEvent({
      type: 'execution_complete', // Reset event
      sessionId,
      timestamp: new Date()
    });

    console.log(`🚀 New execution session started: ${sessionId}`);
  }

  /**
   * Set the current sub-plan context for streaming events
   */
  setCurrentSubPlan(subPlanIndex: number | undefined): void {
    this.currentSubPlanIndex = subPlanIndex;
    console.log(`🔄 ExecutionStream: Set current sub-plan index to ${subPlanIndex}`);
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
   * Stream hierarchical plan creation event
   */
  streamHierarchicalPlanCreated(hierarchicalPlan: any, globalObjective: string, planningStrategy?: string): void {
    if (!this.currentSessionId) {
      console.log('⚠️ StreamHierarchicalPlanCreated: No current session ID');
      return;
    }

    console.log('📡 StreamHierarchicalPlanCreated: Broadcasting hierarchical plan event');
    console.log(`📡 Session ID: ${this.currentSessionId}`);
    console.log(`📡 Connected clients: ${this.clients.size}`);

    const event: ExecutionEvent = {
      type: 'hierarchical_plan_created',
      hierarchicalPlan,
      globalObjective,
      planningStrategy,
      sessionId: this.currentSessionId,
      timestamp: new Date()
    };

    this.executionHistory.push(event);
    this.broadcastEvent(event);
    
    console.log('✅ StreamHierarchicalPlanCreated: Event broadcasted successfully');
  }

  /**
   * Stream step start event
   */
  streamStepStart(stepIndex: number, step: ActionStep, subPlanIndex?: number): void {
    if (!this.currentSessionId) {
      console.log('⚠️ StreamStepStart: No current session ID');
      return;
    }

    // Use provided subPlanIndex or fall back to current context
    const currentSubPlan = subPlanIndex !== undefined ? subPlanIndex : this.currentSubPlanIndex;

    console.log(`📡 StreamStepStart: Broadcasting step start event for step ${stepIndex + 1}${currentSubPlan !== undefined ? ` in sub-plan ${currentSubPlan + 1}` : ''}`);
    console.log(`📡 Step: ${step.description}`);
    console.log(`📡 Connected clients: ${this.clients.size}`);

    const event: ExecutionEvent = {
      type: 'step_start',
      stepIndex,
      step,
      sessionId: this.currentSessionId,
      timestamp: new Date()
    };

    // Add sub-plan context if available
    if (currentSubPlan !== undefined) {
      event.subPlanIndex = currentSubPlan;
    }

    this.executionHistory.push(event);
    this.broadcastEvent(event);
    
    console.log(`✅ StreamStepStart: Step ${stepIndex + 1} start event broadcasted successfully`);
  }

  /**
   * Stream step completion with screenshot
   */
  streamStepComplete(stepIndex: number, step: ActionStep, screenshot?: Buffer, subPlanIndex?: number): void {
    if (!this.currentSessionId) {
      console.log('⚠️ StreamStepComplete: No current session ID');
      return;
    }

    // Use provided subPlanIndex or fall back to current context
    const currentSubPlan = subPlanIndex !== undefined ? subPlanIndex : this.currentSubPlanIndex;

    console.log(`📡 StreamStepComplete: Broadcasting step complete event for step ${stepIndex + 1}${currentSubPlan !== undefined ? ` in sub-plan ${currentSubPlan + 1}` : ''}`);
    console.log(`📡 Step: ${step.description}`);
    console.log(`📡 Connected clients: ${this.clients.size}`);

    const event: ExecutionEvent = {
      type: 'step_complete',
      stepIndex,
      step,
      sessionId: this.currentSessionId,
      timestamp: new Date()
    };

    // Add sub-plan context if available
    if (currentSubPlan !== undefined) {
      event.subPlanIndex = currentSubPlan;
    }

    if (screenshot) {
      event.screenshot = screenshot.toString('base64');
    }

    this.executionHistory.push(event);
    this.broadcastEvent(event);
    
    console.log(`✅ StreamStepComplete: Step ${stepIndex + 1} complete event broadcasted successfully`);
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
   * Stream sub-plan start event
   */
  streamSubPlanStart(subPlanIndex: number, subPlan: any): void {
    if (!this.currentSessionId) return;

    console.log(`📡 StreamSubPlanStart: Broadcasting sub-plan start event for sub-plan ${subPlanIndex + 1}`);

    const event: ExecutionEvent = {
      type: 'sub_plan_start',
      subPlanIndex,
      subPlan,
      sessionId: this.currentSessionId,
      timestamp: new Date()
    };

    this.executionHistory.push(event);
    this.broadcastEvent(event);
    
    console.log(`✅ StreamSubPlanStart: Sub-plan ${subPlanIndex + 1} start event broadcasted successfully`);
  }

  /**
   * Stream sub-plan completion event
   */
  streamSubPlanComplete(subPlanIndex: number, subPlan: any, success: boolean = true, totalSubPlans?: number): void {
    if (!this.currentSessionId) return;

    console.log(`📡 StreamSubPlanComplete: Broadcasting sub-plan complete event for sub-plan ${subPlanIndex + 1} (${success ? 'success' : 'failed'})`);

    const event: ExecutionEvent = {
      type: 'sub_plan_completed',
      subPlanIndex,
      subPlan,
      success,
      sessionId: this.currentSessionId,
      timestamp: new Date()
    };

    // Add total sub-plans count if provided
    if (totalSubPlans !== undefined) {
      (event as any).totalSubPlans = totalSubPlans;
    }

    // Add error property if sub-plan failed
    if (!success) {
      event.error = 'Sub-plan execution failed';
    }

    this.executionHistory.push(event);
    this.broadcastEvent(event);
    
    console.log(`✅ StreamSubPlanComplete: Sub-plan ${subPlanIndex + 1} complete event broadcasted successfully`);
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
    this.cleanupInterval = setInterval(() => {
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

  /**
   * Cleanup resources - mainly for testing
   */
  cleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
    this.clients.clear();
    this.removeAllListeners();
  }
}

// Global singleton instance
export const executionStream = new ExecutionStream();
