import { ClientManager } from '../managers/client-manager';
import { SessionManager } from '../managers/session-manager';
import { ExecutionEvent, StreamMessage } from '../types/streaming.types';

/**
 * Handles event processing and broadcasting
 */
export class EventProcessor {
  constructor(
    private sessionManager: SessionManager,
    private clientManager: ClientManager
  ) { }

  /**
   * Process and broadcast an execution event
   */
  processEvent(event: ExecutionEvent): void {
    // Validate session
    if (!this.sessionManager.isSessionActive()) {
      console.warn('⚠️ EventProcessor: No active session, ignoring event');
      return;
    }

    // Add to history
    this.sessionManager.addEventToHistory(event);

    // Broadcast to clients
    const message: StreamMessage = {
      type: 'execution_event',
      data: event
    };

    const sentCount = this.clientManager.broadcastToAll(message);

    if (sentCount > 0) {
      console.log(`📡 Event '${event.type}' broadcasted to ${sentCount} clients`);
    }
  }

  /**
   * Process session start event
   */
  processSessionStart(sessionId: string): void {
    this.sessionManager.startSession(sessionId);

    // Send reset event to all clients
    const resetEvent: ExecutionEvent = {
      type: 'execution_complete', // Reset event
      sessionId,
      timestamp: new Date()
    };

    this.processEvent(resetEvent);
  }

  /**
   * Send history to a new client
   */
  sendHistoryToClient(clientId: string): void {
    const history = this.sessionManager.getHistory();
    if (history.length > 0) {
      this.clientManager.sendHistoryToClient(clientId, history);
    }
  }

  /**
   * Process client connection
   */
  processClientConnection(clientId: string, response: any): void {
    this.clientManager.addClient(clientId, response);
    this.sendHistoryToClient(clientId);
  }

  /**
   * Process client disconnection
   */
  processClientDisconnection(clientId: string): void {
    this.clientManager.removeClient(clientId);
  }

  /**
   * Get current execution status
   */
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
