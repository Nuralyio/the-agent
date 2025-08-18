import { EventEmitter } from 'events';
import { ActionStep } from '../types';
import { EventFactory } from './event-factory';
import { ClientManager } from './client-manager';
import { SessionManager } from './session-manager';
import { EventProcessor } from './event-processor';
import { ExecutionEvent } from './streaming.types';

/**
 * ExecutionStream - Provides real-time execution monitor for web integration
 */
export class ExecutionStream extends EventEmitter {
  private sessionManager: SessionManager;
  private clientManager: ClientManager;
  private eventProcessor: EventProcessor;
  private cleanupInterval?: NodeJS.Timeout;

  constructor() {
    super();

    this.sessionManager = new SessionManager();
    this.clientManager = new ClientManager();
    this.eventProcessor = new EventProcessor(this.sessionManager, this.clientManager);

    // Only setup cleanup interval in non-test environments
    if (process.env.NODE_ENV !== 'test' && !process.env.JEST_WORKER_ID) {
      this.setupCleanupInterval();
    }
  }

  /**
   * Start a new execution session
   */
  startSession(sessionId: string): void {
    this.sessionManager.startSession(sessionId);

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
  setSubPlanContext(subPlanIndex: number): void {
    this.sessionManager.setCurrentSubPlan(subPlanIndex);
  }

  /**
   * Notify plan creation (legacy method name for backward compatibility)
   */
  streamPlanCreated(totalSteps: number, steps?: ActionStep[]): void {
    this.notifyPlanCreated(totalSteps, steps);
  }

  /**
   * Legacy method for plan creation
   */
  streamHierarchicalPlanCreated(
    hierarchicalPlan: any,
    globalObjective: string,
    planningStrategy?: string
  ): void {
    this.notifyHierarchicalPlanCreated(hierarchicalPlan, globalObjective, planningStrategy);
  }

  /**
   * Legacy method for step start
   */
  streamStepStart(stepIndex: number, step: ActionStep, subPlanIndex?: number): void {
    this.notifyStepStart(stepIndex, step, subPlanIndex);
  }

  /**
   * Legacy method for step completion
   */
  streamStepComplete(
    stepIndex: number,
    step: ActionStep,
    screenshot?: Buffer,
    subPlanIndex?: number
  ): void {
    this.notifyStepComplete(stepIndex, step, screenshot, subPlanIndex);
  }

  /**
   * Legacy method for step error
   */
  streamStepError(
    stepIndex: number,
    step: ActionStep,
    error: string,
    subPlanIndex?: number
  ): void {
    this.notifyStepError(stepIndex, step, error, subPlanIndex);
  }

  /**
   * Legacy method for page change
   */
  streamPageChange(url: string, title: string, screenshot?: Buffer): void {
    this.notifyPageChange(url, title, screenshot);
  }

  /**
   * Legacy method for execution completion
   */
  streamExecutionComplete(): void {
    this.notifyExecutionComplete();
  }

  /**
   * Legacy method for sub-plan start
   */
  streamSubPlanStart(subPlanIndex: number, subPlan: any): void {
    this.notifySubPlanStart(subPlanIndex, subPlan);
  }

  /**
   * Legacy method for sub-plan completion
   */
  streamSubPlanComplete(
    subPlanIndex: number,
    subPlan: any,
    success: boolean = true,
    totalSubPlans?: number
  ): void {
    this.notifySubPlanComplete(subPlanIndex, subPlan, success, totalSubPlans);
  }

  /**
   * Legacy method for setting current sub-plan
   */
  setCurrentSubPlan(subPlanIndex: number | undefined): void {
    this.sessionManager.setCurrentSubPlan(subPlanIndex);
  }

  /**
   * Notify plan creation
   */
  notifyPlanCreated(totalSteps: number, steps?: ActionStep[]): void {
    const sessionId = this.sessionManager.getCurrentSessionId();
    if (!sessionId) return;

    const event = EventFactory.createPlanCreatedEvent(sessionId, totalSteps, steps);
    this.eventProcessor.processEvent(event);
  }

  /**
   * Notify plan creation
   */
  notifyHierarchicalPlanCreated(
    hierarchicalPlan: any,
    globalObjective: string,
    planningStrategy?: string
  ): void {
    const sessionId = this.sessionManager.getCurrentSessionId();
    if (!sessionId) {
      console.warn('⚠️ No active session for plan');
      return;
    }

    const event = EventFactory.createHierarchicalPlanCreatedEvent(
      sessionId,
      hierarchicalPlan,
      globalObjective,
      planningStrategy
    );
    this.eventProcessor.processEvent(event);
  }

  /**
   * Notify step start
   */
  notifyStepStart(stepIndex: number, step: ActionStep, subPlanIndex?: number): void {
    const sessionId = this.sessionManager.getCurrentSessionId();
    if (!sessionId) {
      console.warn('⚠️ No active session for step start');
      return;
    }

    const currentSubPlan = subPlanIndex !== undefined ? subPlanIndex : this.sessionManager.getCurrentSubPlan();

    console.log(`📡 Step ${stepIndex + 1} started (sub-plan: ${currentSubPlan})`);
    console.log(`📡 Connected clients: ${this.clientManager.getClientCount()}`);

    const event = EventFactory.createStepStartEvent(sessionId, stepIndex, step, currentSubPlan);
    this.eventProcessor.processEvent(event);
  }

  /**
   * Notify step completion
   */
  notifyStepComplete(
    stepIndex: number,
    step: ActionStep,
    screenshot?: Buffer,
    subPlanIndex?: number
  ): void {
    const sessionId = this.sessionManager.getCurrentSessionId();
    if (!sessionId) {
      console.warn('⚠️ No active session for step complete');
      return;
    }

    const currentSubPlan = subPlanIndex !== undefined ? subPlanIndex : this.sessionManager.getCurrentSubPlan();

    console.log(`📡 Step ${stepIndex + 1} completed (sub-plan: ${currentSubPlan})`);
    console.log(`📡 Connected clients: ${this.clientManager.getClientCount()}`);

    const event = EventFactory.createStepCompleteEvent(sessionId, stepIndex, step, screenshot, currentSubPlan);
    this.eventProcessor.processEvent(event);
  }

  /**
   * Notify step error
   */
  notifyStepError(
    stepIndex: number,
    step: ActionStep,
    error: string,
    subPlanIndex?: number
  ): void {
    const sessionId = this.sessionManager.getCurrentSessionId();
    if (!sessionId) return;

    const currentSubPlan = subPlanIndex !== undefined ? subPlanIndex : this.sessionManager.getCurrentSubPlan();

    const event = EventFactory.createStepErrorEvent(sessionId, stepIndex, step, error, currentSubPlan);
    this.eventProcessor.processEvent(event);
  }

  /**
   * Notify page change
   */
  notifyPageChange(url: string, title: string, screenshot?: Buffer): void {
    const sessionId = this.sessionManager.getCurrentSessionId();
    if (!sessionId) return;

    const event = EventFactory.createPageChangeEvent(sessionId, url, title, screenshot);
    this.eventProcessor.processEvent(event);
  }

  /**
   * Notify execution completion
   */
  notifyExecutionComplete(): void {
    const sessionId = this.sessionManager.getCurrentSessionId();
    if (!sessionId) return;

    const event = EventFactory.createExecutionCompleteEvent(sessionId);
    this.eventProcessor.processEvent(event);

    console.log(`🎯 Execution completed for session: ${sessionId}`);
  }

  /**
   * Notify sub-plan start
   */
  notifySubPlanStart(subPlanIndex: number, subPlan: any): void {
    const sessionId = this.sessionManager.getCurrentSessionId();
    if (!sessionId) return;

    const event = EventFactory.createSubPlanStartEvent(sessionId, subPlanIndex, subPlan);
    this.eventProcessor.processEvent(event);
  }

  /**
   * Notify sub-plan completion
   */
  notifySubPlanComplete(
    subPlanIndex: number,
    subPlan: any,
    success: boolean = true,
    totalSubPlans?: number
  ): void {
    const sessionId = this.sessionManager.getCurrentSessionId();
    if (!sessionId) return;

    const event = EventFactory.createSubPlanCompleteEvent(sessionId, subPlanIndex, subPlan, success, totalSubPlans);
    this.eventProcessor.processEvent(event);
  }

  /**
   * Add a client connection
   */
  addClient(clientId: string, response: any): void {
    console.log(`📺 New monitor client connected: ${clientId}`);

    this.clientManager.addClient(clientId, response);

    // Send connection confirmation
    this.clientManager.sendToClient(clientId, {
      type: 'connection',
      data: {
        message: 'Connected to execution stream',
        sessionId: this.sessionManager.getCurrentSessionId()
      }
    });

    // Send recent history
    const history = this.sessionManager.getHistory();
    if (history.length > 0) {
      this.clientManager.sendToClient(clientId, {
        type: 'history',
        data: history.slice(-10) // Send last 10 events
      });
    }
  }

  /**
   * Remove a client connection
   */
  removeClient(clientId: string): void {
    this.clientManager.removeClient(clientId);
    console.log(`📺 Monitor client disconnected: ${clientId}`);
  }

  /**
   * Broadcast event to all connected clients
   */
  private broadcastEvent(event: ExecutionEvent): void {
    this.eventProcessor.processEvent(event);
  }

  /**
   * Get execution history
   */
  getExecutionHistory(): ExecutionEvent[] {
    return this.sessionManager.getHistory();
  }

  /**
   * Get connected clients info
   */
  getConnectedClients(): string[] {
    return this.clientManager.getClientIds();
  }

  /**
   * Get execution status
   */
  getExecutionStatus(): any {
    return {
      sessionId: this.sessionManager.getCurrentSessionId(),
      isActive: this.sessionManager.isSessionActive(),
      totalEvents: this.sessionManager.getHistory().length,
      connectedClients: this.clientManager.getClientCount(),
      lastEvent: this.sessionManager.getLastEvent()
    };
  }

  /**
   * Setup periodic cleanup of dead connections
   */
  private setupCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      // ClientManager has its own cleanup interval, so we don't need to do anything here
      // This is just a placeholder for backward compatibility
    }, 30000); // Check every 30 seconds
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
    this.clientManager.cleanup();
    console.log('🧹 ExecutionStream cleaned up');
  }
}

// Create and export singleton instance for backward compatibility
export const executionStream = new ExecutionStream();
