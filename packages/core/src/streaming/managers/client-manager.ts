import { StreamClient, StreamMessage } from '../types/streaming.types';

/**
 * Manages stream client connections and broadcasting
 */
export class ClientManager {
  private clients: Map<string, StreamClient> = new Map();
  private cleanupInterval?: NodeJS.Timeout;

  constructor() {
    // Only setup cleanup interval in non-test environments
    if (process.env.NODE_ENV !== 'test' && !process.env.JEST_WORKER_ID) {
      this.setupCleanupInterval();
    }
  }

  /**
   * Add a new SSE client
   */
  addClient(clientId: string, response: any): void {
    console.log(`📺 New visualization client connected: ${clientId}`);

    this.clients.set(clientId, {
      id: clientId,
      response,
      lastPing: new Date(),
      connectionTime: new Date()
    });

    // Send connection confirmation
    this.sendToClient(clientId, {
      type: 'connection',
      data: { connected: true, clientId }
    });
  }

  /**
   * Remove a client
   */
  removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      console.log(`📺 Visualization client disconnected: ${clientId}`);
      this.clients.delete(clientId);
    }
  }

  /**
   * Get client count
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Check if client exists
   */
  hasClient(clientId: string): boolean {
    return this.clients.has(clientId);
  }

  /**
   * Send message to specific client
   */
  sendToClient(clientId: string, message: StreamMessage): boolean {
    const client = this.clients.get(clientId);
    if (!client) {
      console.warn(`📺 Client ${clientId} not found`);
      return false;
    }

    try {
      client.response.write(`data: ${JSON.stringify(message)}\n\n`);
      client.lastPing = new Date();
      return true;
    } catch (error) {
      console.warn(`📺 Failed to send to client ${clientId}:`, error);
      this.removeClient(clientId);
      return false;
    }
  }

  /**
   * Broadcast message to all clients
   */
  broadcastToAll(message: StreamMessage): number {
    let successCount = 0;

    this.clients.forEach((client, clientId) => {
      if (this.sendToClient(clientId, message)) {
        successCount++;
      }
    });

    return successCount;
  }

  /**
   * Send history to specific client
   */
  sendHistoryToClient(clientId: string, history: any[]): boolean {
    return this.sendToClient(clientId, {
      type: 'history',
      data: history
    });
  }

  /**
   * Get all client IDs
   */
  getClientIds(): string[] {
    return Array.from(this.clients.keys());
  }

  /**
   * Setup cleanup interval for stale connections
   */
  private setupCleanupInterval(): void {
    // Clean up dead connections every 30 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanupStaleClients();
    }, 30000);
  }

  /**
   * Clean up stale clients that haven't pinged recently
   */
  private cleanupStaleClients(): void {
    const now = new Date();
    const timeout = 60000; // 1 minute timeout

    this.clients.forEach((client, clientId) => {
      if (now.getTime() - client.lastPing.getTime() > timeout) {
        console.log(`📺 Cleaning up stale client: ${clientId}`);
        this.removeClient(clientId);
      }
    });
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
    this.clients.clear();
  }
}
