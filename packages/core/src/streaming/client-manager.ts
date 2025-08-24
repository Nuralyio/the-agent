import { StreamClient, StreamMessage } from './streaming.types';

/**
 * Manages stream client connections and broadcasting
 */
export class ClientManager {
  private clients: Map<string, StreamClient> = new Map();
  private cleanupInterval?: NodeJS.Timeout;

  constructor() {

    if (process.env.NODE_ENV !== 'test' && !process.env.JEST_WORKER_ID) {
      this.setupCleanupInterval();
    }
  }

  addClient(clientId: string, response: any): void {
    console.log(`📺 New monitor client connected: ${clientId}`);

    this.clients.set(clientId, {
      id: clientId,
      response,
      lastPing: new Date(),
      connectionTime: new Date()
    });


    this.sendToClient(clientId, {
      type: 'connection',
      data: { connected: true, clientId }
    });
  }


  removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      console.log(`📺 Monitor client disconnected: ${clientId}`);
      this.clients.delete(clientId);
    }
  }


  getClientCount(): number {
    return this.clients.size;
  }


  hasClient(clientId: string): boolean {
    return this.clients.has(clientId);
  }

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


  broadcastToAll(message: StreamMessage): number {
    let successCount = 0;

    this.clients.forEach((client, clientId) => {
      if (this.sendToClient(clientId, message)) {
        successCount++;
      }
    });

    return successCount;
  }

  sendHistoryToClient(clientId: string, history: any[]): boolean {
    return this.sendToClient(clientId, {
      type: 'history',
      data: history
    });
  }

  getClientIds(): string[] {
    return Array.from(this.clients.keys());
  }


  private setupCleanupInterval(): void {

    this.cleanupInterval = setInterval(() => {
      this.cleanupStaleClients();
    }, 30000);
  }

  private cleanupStaleClients(): void {
    const now = new Date();
    const timeout = 60000;

    this.clients.forEach((client, clientId) => {
      if (now.getTime() - client.lastPing.getTime() > timeout) {
        console.log(`📺 Cleaning up stale client: ${clientId}`);
        this.removeClient(clientId);
      }
    });
  }


  cleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
    this.clients.clear();
  }
}
