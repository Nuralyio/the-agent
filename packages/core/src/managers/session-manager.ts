import { v4 as uuidv4 } from 'uuid';

export interface AutomationSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'completed' | 'failed' | 'aborted';
  metadata: {
    userAgent?: string;
    browserType: string;
    totalSteps: number;
    completedSteps: number;
  };
}


export class SessionManager {
  private activeSessions: Map<string, AutomationSession> = new Map();
  private sessionHistory: AutomationSession[] = [];

  /**
   * Start a new automation session
   */
  startSession(metadata: Partial<AutomationSession['metadata']> = {}): string {
    const sessionId = uuidv4();
    const session: AutomationSession = {
      id: sessionId,
      startTime: new Date(),
      status: 'active',
      metadata: {
        browserType: 'chromium',
        totalSteps: 0,
        completedSteps: 0,
        ...metadata
      }
    };

    this.activeSessions.set(sessionId, session);
    console.log(`🎯 Started automation session: ${sessionId}`);

    return sessionId;
  }

  /**
   * End an automation session
   */
  endSession(sessionId: string, status: 'completed' | 'failed' | 'aborted' = 'completed'): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      console.warn(`⚠️ Session ${sessionId} not found`);
      return;
    }

    session.endTime = new Date();
    session.status = status;

    // Move to history and remove from active
    this.sessionHistory.push(session);
    this.activeSessions.delete(sessionId);

    console.log(`✅ Ended automation session: ${sessionId} (${status})`);
  }

  /**
   * Get active session by ID
   */
  getSession(sessionId: string): AutomationSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): AutomationSession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Get session history
   */
  getSessionHistory(limit: number = 50): AutomationSession[] {
    return this.sessionHistory.slice(-limit);
  }

  /**
   * Update session progress
   */
  updateSessionProgress(sessionId: string, totalSteps: number, completedSteps: number): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.metadata.totalSteps = totalSteps;
      session.metadata.completedSteps = completedSteps;
    }
  }

  /**
   * Clean up old sessions from history
   */
  cleanupSessions(maxAge: number = 24 * 60 * 60 * 1000): void {
    const cutoff = new Date(Date.now() - maxAge);
    this.sessionHistory = this.sessionHistory.filter(
      session => (session.endTime || session.startTime) > cutoff
    );
  }
}

// Global singleton instance
export const sessionManager = new SessionManager();
