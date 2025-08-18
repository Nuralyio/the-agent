import { ExecutionEvent } from './streaming.types';

/**
 * Manages execution session state and history
 */
export class SessionManager {
  private currentSessionId: string | null = null;
  private executionHistory: ExecutionEvent[] = [];
  private currentSubPlanIndex: number | undefined = undefined;

  /**
   * Start a new execution session
   */
  startSession(sessionId: string): void {
    this.currentSessionId = sessionId;
    this.executionHistory = [];
    this.currentSubPlanIndex = undefined;

    console.log(`🚀 New execution session started: ${sessionId}`);
  }

  /**
   * Get current session ID
   */
  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  /**
   * Set the current sub-plan context
   */
  setCurrentSubPlan(subPlanIndex: number | undefined): void {
    this.currentSubPlanIndex = subPlanIndex;
    console.log(`🔄 SessionManager: Set current sub-plan index to ${subPlanIndex}`);
  }

  /**
   * Get current sub-plan index
   */
  getCurrentSubPlan(): number | undefined {
    return this.currentSubPlanIndex;
  }

  /**
   * Add event to history
   */
  addEventToHistory(event: ExecutionEvent): void {
    this.executionHistory.push(event);
  }

  /**
   * Get execution history
   */
  getHistory(): ExecutionEvent[] {
    return [...this.executionHistory];
  }

  /**
   * Get last event from history
   */
  getLastEvent(): ExecutionEvent | undefined {
    return this.executionHistory[this.executionHistory.length - 1];
  }

  /**
   * Get total number of events
   */
  getTotalEvents(): number {
    return this.executionHistory.length;
  }

  /**
   * Check if session is active
   */
  isSessionActive(): boolean {
    return this.currentSessionId !== null;
  }

  /**
   * Clear session data
   */
  clearSession(): void {
    this.currentSessionId = null;
    this.executionHistory = [];
    this.currentSubPlanIndex = undefined;
  }
}
