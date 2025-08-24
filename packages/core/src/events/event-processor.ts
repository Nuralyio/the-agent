import { ClientManager } from './client-manager';
import { SessionManager } from './session-manager';
import { ExecutionEvent, StreamMessage } from './streaming.types';

/**
 * Handles event processing and broadcasting
 */
export class EventProcessor {
  constructor(
    private sessionManager: SessionManager,
    private clientManager: ClientManager
  ) { }

  processEvent(event: ExecutionEvent): void {
    if (!this.sessionManager.isSessionActive()) {
      console.warn('⚠️ EventProcessor: No active session, ignoring event');
      return;
    }
    this.sessionManager.addEventToHistory(event);

    const message: StreamMessage = {
      type: 'execution_event',
      data: event
    };

    const sentCount = this.clientManager.broadcastToAll(message);

    if (sentCount > 0) {
      console.log(`📡 Event '${event.type}' broadcasted to ${sentCount} clients`);
    }
  }

  processSessionStart(sessionId: string): void {
    this.sessionManager.startSession(sessionId);

    const resetEvent: ExecutionEvent = {
      type: 'execution_complete',
      sessionId,
      timestamp: new Date()
    };

    this.processEvent(resetEvent);
  }

  sendHistoryToClient(clientId: string): void {
    const history = this.sessionManager.getHistory();
    if (history.length > 0) {
      this.clientManager.sendHistoryToClient(clientId, history);
    }
  }

  processClientConnection(clientId: string, response: any): void {
    this.clientManager.addClient(clientId, response);
    this.sendHistoryToClient(clientId);
  }

  processClientDisconnection(clientId: string): void {
    this.clientManager.removeClient(clientId);
  }

  getExecutionStatus() {
    return {
      sessionId: this.sessionManager.getCurrentSessionId(),
      isActive: this.sessionManager.isSessionActive(),
      totalEvents: this.sessionManager.getTotalEvents(),
      connectedClients: this.clientManager.getClientCount(),
      lastEvent: this.sessionManager.getLastEvent()
    };
  }
}
