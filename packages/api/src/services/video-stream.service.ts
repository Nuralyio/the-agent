import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { AutomationService } from './automation.service';

export interface VideoStreamOptions {
  fps?: number;
  quality?: number;
  width?: number;
  height?: number;
  format?: 'png' | 'jpeg';
  enableAdaptiveFps?: boolean;
  maxFrameSize?: number; // Max frame size in KB
}

export interface VideoStreamClient {
  id: string;
  socket: {
    send: (data: string) => void;
    close: () => void;
    readyState: number;
    addEventListener?: (event: string, callback: Function) => void;
    removeEventListener?: (event: string, callback: Function) => void;
  };
  sessionId?: string;
}

/**
 * Video streaming service for real-time browser video feeds
 * Optimized for performance with adaptive FPS and frame compression
 */
export class VideoStreamService extends EventEmitter {
  private clients = new Map<string, VideoStreamClient>();
  private activeStreams = new Map<string, NodeJS.Timeout>();
  private frameIntervals = new Map<string, NodeJS.Timeout>();
  private lastFrameCache = new Map<string, { data: string; timestamp: number }>();
  private frameSkipCounter = new Map<string, number>();
  private performanceMetrics = new Map<string, { 
    framesSent: number; 
    bytesTransferred: number; 
    avgFrameSize: number;
    lastFpsCheck: number;
    actualFps: number;
  }>();
  
  constructor(private automationService: AutomationService) {
    super();
  }

  /**
   * Add a new WebSocket client for video streaming
   */
  addClient(id: string, socket: any, sessionId?: string): void {
    const client: VideoStreamClient = { id, socket, sessionId };
    this.clients.set(id, client);

    // Use the appropriate event handling method based on socket type
    if (typeof socket.on === 'function') {
      // Node.js ws WebSocket
      socket.on('close', () => {
        this.removeClient(id);
      });

      socket.on('error', (error: any) => {
        console.error(`WebSocket error for client ${id}:`, error);
        this.removeClient(id);
      });
    } else if (socket.addEventListener) {
      // Browser WebSocket
      socket.addEventListener('close', () => {
        this.removeClient(id);
      });

      socket.addEventListener('error', (error: any) => {
        console.error(`WebSocket error for client ${id}:`, error);
        this.removeClient(id);
      });
    }

    // Send initial connection confirmation
    this.sendMessage(id, {
      type: 'connected',
      clientId: id,
      timestamp: Date.now()
    });
  }

  /**
   * Remove a client
   */
  removeClient(id: string): void {
    const client = this.clients.get(id);
    if (client) {
      this.stopVideoStream(id);
      this.clients.delete(id);
    }
  }

  /**
   * Start video streaming for a client with performance optimizations
   */
  async startVideoStream(clientId: string, options: VideoStreamOptions = {}): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) {
      throw new Error(`Client ${clientId} not found`);
    }

    // Stop any existing stream for this client
    this.stopVideoStream(clientId);

    const fps = options.fps || 10; // Default 10 FPS
    const enableAdaptiveFps = options.enableAdaptiveFps !== false; // Default true
    const maxFrameSize = options.maxFrameSize || 500; // 500KB max frame size
    const interval = 1000 / fps;

    // Initialize performance metrics
    this.performanceMetrics.set(clientId, {
      framesSent: 0,
      bytesTransferred: 0,
      avgFrameSize: 0,
      lastFpsCheck: Date.now(),
      actualFps: 0
    });

    // Initialize frame skip counter for adaptive FPS
    this.frameSkipCounter.set(clientId, 0);

    // Start the frame capture interval
    const frameInterval = setInterval(async () => {
      try {
        const shouldSkipFrame = enableAdaptiveFps && this.shouldSkipFrame(clientId);
        if (!shouldSkipFrame) {
          await this.captureAndSendFrame(clientId, options);
        }
      } catch (error) {
        console.error(`Error capturing frame for client ${clientId}:`, error);
        this.sendMessage(clientId, {
          type: 'error',
          message: 'Failed to capture frame',
          timestamp: Date.now()
        });
      }
    }, interval);

    this.frameIntervals.set(clientId, frameInterval);
    
    this.sendMessage(clientId, {
      type: 'stream_started',
      fps,
      timestamp: Date.now(),
      options: {
        enableAdaptiveFps,
        maxFrameSize,
        format: options.format || 'jpeg'
      }
    });
  }

  /**
   * Stop video streaming for a client
   */
  stopVideoStream(clientId: string): void {
    const interval = this.frameIntervals.get(clientId);
    if (interval) {
      clearInterval(interval);
      this.frameIntervals.delete(clientId);
    }

    this.sendMessage(clientId, {
      type: 'stream_stopped',
      timestamp: Date.now()
    });
  }

  /**
   * Capture a frame and send it to the client with performance optimizations
   */
  private async captureAndSendFrame(clientId: string, options: VideoStreamOptions = {}): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      // Get the current page screenshot with optimized settings
      const screenshotOptions = {
        fullPage: false,
        type: (options.format || 'jpeg') as 'png' | 'jpeg',
        quality: options.quality || 70 // Lower quality for better performance
      };

      const screenshot = await this.automationService.getCurrentScreenshot();
      
      if (screenshot) {
        // Convert buffer to base64
        const base64Frame = screenshot.toString('base64');
        const frameSize = Math.round(base64Frame.length * 0.75 / 1024); // Approximate KB size

        // Check if frame is too large
        const maxFrameSize = options.maxFrameSize || 500;
        if (frameSize > maxFrameSize) {
          console.warn(`Frame size ${frameSize}KB exceeds limit ${maxFrameSize}KB for client ${clientId}`);
          // Skip this frame to maintain performance
          this.incrementSkipCounter(clientId);
          return;
        }

        // Check for frame similarity to reduce redundant data
        const lastFrame = this.lastFrameCache.get(clientId);
        const isSimilarFrame = lastFrame && this.isFrameSimilar(base64Frame, lastFrame.data);
        
        if (isSimilarFrame) {
          // Skip similar frames to save bandwidth
          this.incrementSkipCounter(clientId);
          return;
        }

        // Cache this frame
        this.lastFrameCache.set(clientId, {
          data: base64Frame,
          timestamp: Date.now()
        });

        // Update performance metrics
        this.updatePerformanceMetrics(clientId, frameSize);

        this.sendMessage(clientId, {
          type: 'frame',
          data: base64Frame,
          timestamp: Date.now(),
          frameSize: frameSize,
          format: options.format || 'jpeg'
        });
      }
    } catch (error) {
      console.error(`Error capturing frame for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Send a message to a specific client
   */
  private sendMessage(clientId: string, message: any): void {
    const client = this.clients.get(clientId);
    if (client && client.socket.readyState === 1) { // 1 = OPEN state
      try {
        client.socket.send(JSON.stringify(message));
      } catch (error) {
        console.error(`Failed to send message to client ${clientId}:`, error);
        this.removeClient(clientId);
      }
    }
  }

  /**
   * Broadcast a message to all connected clients
   */
  broadcast(message: any): void {
    for (const [clientId] of this.clients) {
      this.sendMessage(clientId, message);
    }
  }

  /**
   * Get all connected clients
   */
  getClients(): VideoStreamClient[] {
    return Array.from(this.clients.values());
  }

  /**
   * Get client by ID
   */
  getClient(id: string): VideoStreamClient | undefined {
    return this.clients.get(id);
  }

  /**
   * Check if a client is streaming
   */
  isStreaming(clientId: string): boolean {
    return this.frameIntervals.has(clientId);
  }

  /**
   * Cleanup all streams and clients
   */
  cleanup(): void {
    // Stop all streams
    for (const clientId of this.frameIntervals.keys()) {
      this.stopVideoStream(clientId);
    }

    // Close all client connections
    for (const client of this.clients.values()) {
      if (client.socket.readyState === 1) { // OPEN state
        client.socket.close();
      }
    }

    this.clients.clear();
    this.frameIntervals.clear();
    this.activeStreams.clear();
    this.lastFrameCache.clear();
    this.frameSkipCounter.clear();
    this.performanceMetrics.clear();
  }

  /**
   * Performance optimization: Check if frame should be skipped based on adaptive FPS
   */
  private shouldSkipFrame(clientId: string): boolean {
    const skipCount = this.frameSkipCounter.get(clientId) || 0;
    const metrics = this.performanceMetrics.get(clientId);
    
    if (!metrics) return false;

    // Skip frames if average frame size is too large (adaptive quality)
    const avgFrameSize = metrics.avgFrameSize;
    const skipThreshold = avgFrameSize > 300 ? 2 : avgFrameSize > 150 ? 1 : 0;
    
    return skipCount < skipThreshold;
  }

  /**
   * Performance optimization: Check if frames are similar to reduce redundant data
   */
  private isFrameSimilar(currentFrame: string, lastFrame: string, threshold = 0.95): boolean {
    // Simple similarity check based on string length and partial content comparison
    if (Math.abs(currentFrame.length - lastFrame.length) > lastFrame.length * 0.1) {
      return false;
    }

    // Sample comparison - compare every 1000th character for performance
    const sampleSize = Math.min(1000, Math.floor(currentFrame.length / 100));
    let matches = 0;
    
    for (let i = 0; i < sampleSize; i++) {
      const index = Math.floor(i * currentFrame.length / sampleSize);
      if (currentFrame[index] === lastFrame[index]) {
        matches++;
      }
    }
    
    return (matches / sampleSize) >= threshold;
  }

  /**
   * Performance optimization: Increment frame skip counter
   */
  private incrementSkipCounter(clientId: string): void {
    const currentCount = this.frameSkipCounter.get(clientId) || 0;
    this.frameSkipCounter.set(clientId, currentCount + 1);
  }

  /**
   * Performance optimization: Update performance metrics
   */
  private updatePerformanceMetrics(clientId: string, frameSize: number): void {
    const metrics = this.performanceMetrics.get(clientId);
    if (!metrics) return;

    metrics.framesSent++;
    metrics.bytesTransferred += frameSize;
    metrics.avgFrameSize = metrics.bytesTransferred / metrics.framesSent;

    // Calculate actual FPS every 5 seconds
    const now = Date.now();
    if (now - metrics.lastFpsCheck > 5000) {
      const timeDiff = (now - metrics.lastFpsCheck) / 1000;
      metrics.actualFps = metrics.framesSent / timeDiff;
      metrics.framesSent = 0;
      metrics.lastFpsCheck = now;
    }

    // Reset frame skip counter after successful send
    this.frameSkipCounter.set(clientId, 0);
  }

  /**
   * Get performance metrics for a client
   */
  getPerformanceMetrics(clientId: string) {
    return this.performanceMetrics.get(clientId);
  }

  /**
   * Get all performance metrics
   */
  getAllPerformanceMetrics() {
    const metrics: Record<string, any> = {};
    for (const [clientId, data] of this.performanceMetrics) {
      metrics[clientId] = {
        ...data,
        isStreaming: this.isStreaming(clientId)
      };
    }
    return metrics;
  }

  /**
   * Handle click event from browser
   */
  async handleClickEvent(clientId: string, x: number, y: number): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) {
      throw new Error(`Client ${clientId} not found`);
    }

    try {
      // Get current automation instance and perform click
      const currentAutomation = this.automationService.getCurrentAutomation();
      if (!currentAutomation) {
        throw new Error('No active browser session');
      }

      const browserManager = currentAutomation.getBrowserManager();
      const currentPage = await browserManager.getCurrentPage();
      if (!currentPage) {
        throw new Error('No active page found');
      }

      // Access the underlying Playwright page instance for mouse operations
      const playwrightPage = (currentPage as any).page;
      if (playwrightPage && playwrightPage.mouse) {
        // Perform click at coordinates using Playwright mouse API
        await playwrightPage.mouse.click(x, y);
        console.log(`🖱️ Click performed at (${x}, ${y}) for client ${clientId}`);
      } else {
        throw new Error('Mouse operations not supported by current page adapter');
      }

      // Send confirmation back to client
      this.sendMessage(clientId, {
        type: 'click_response',
        success: true,
        x,
        y,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error(`Error handling click event for client ${clientId}:`, error);
      this.sendMessage(clientId, {
        type: 'click_response',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      });
    }
  }

  /**
   * Handle keyboard event from browser
   */
  async handleKeyboardEvent(clientId: string, text: string): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) {
      throw new Error(`Client ${clientId} not found`);
    }

    try {
      // Get current automation instance and perform typing
      const currentAutomation = this.automationService.getCurrentAutomation();
      if (!currentAutomation) {
        throw new Error('No active browser session');
      }

      const browserManager = currentAutomation.getBrowserManager();
      const currentPage = await browserManager.getCurrentPage();
      if (!currentPage) {
        throw new Error('No active page found');
      }

      // Access the underlying Playwright page instance for keyboard operations
      const playwrightPage = (currentPage as any).page;
      if (playwrightPage && playwrightPage.keyboard) {
        // Handle special keys
        if (text.startsWith('{') && text.endsWith('}')) {
          const key = text.slice(1, -1);
          await playwrightPage.keyboard.press(key);
        } else {
          // Regular text input
          await playwrightPage.keyboard.type(text);
        }
        console.log(`⌨️ Keyboard input "${text}" for client ${clientId}`);
      } else {
        throw new Error('Keyboard operations not supported by current page adapter');
      }

      // Send confirmation back to client
      this.sendMessage(clientId, {
        type: 'keyboard_response',
        success: true,
        text,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error(`Error handling keyboard event for client ${clientId}:`, error);
      this.sendMessage(clientId, {
        type: 'keyboard_response',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      });
    }
  }
}
