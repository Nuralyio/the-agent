import { Request, Response } from 'express';
import { automationService } from '../services';
import { VideoStreamService } from '../services/video-stream.service';

/**
 * Controller for video streaming endpoints
 */
export class VideoStreamController {
  private videoStreamService: VideoStreamService;

  constructor() {
    this.videoStreamService = new VideoStreamService(automationService);
  }

  /**
   * Start video streaming for a session
   */
  async startStream(req: Request, res: Response): Promise<void> {
    try {
      const { fps = 10, quality = 80, width = 1280, height = 720 } = req.body;
      const clientId = req.headers['x-client-id'] as string || 'default';

      await this.videoStreamService.startVideoStream(clientId, {
        fps,
        quality,
        width,
        height
      });

      res.json({
        success: true,
        message: 'Video stream started',
        clientId,
        streamOptions: { fps, quality, width, height }
      });
    } catch (error) {
      console.error('Error starting video stream:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start video stream'
      });
    }
  }

  /**
   * Stop video streaming for a session
   */
  async stopStream(req: Request, res: Response): Promise<void> {
    try {
      const clientId = req.headers['x-client-id'] as string || 'default';

      this.videoStreamService.stopVideoStream(clientId);

      res.json({
        success: true,
        message: 'Video stream stopped',
        clientId
      });
    } catch (error) {
      console.error('Error stopping video stream:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to stop video stream'
      });
    }
  }

  /**
   * Get current stream status
   */
  async getStreamStatus(req: Request, res: Response): Promise<void> {
    try {
      const clientId = req.headers['x-client-id'] as string || 'default';
      const isStreaming = this.videoStreamService.isStreaming(clientId);
      const client = this.videoStreamService.getClient(clientId);

      res.json({
        success: true,
        clientId,
        isStreaming,
        connected: !!client,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error getting stream status:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get stream status'
      });
    }
  }

  /**
   * Get all connected clients
   */
  async getClients(req: Request, res: Response): Promise<void> {
    try {
      const clients = this.videoStreamService.getClients();

      res.json({
        success: true,
        clients: clients.map(client => ({
          id: client.id,
          sessionId: client.sessionId,
          connected: true,
          isStreaming: this.videoStreamService.isStreaming(client.id)
        })),
        count: clients.length
      });
    } catch (error) {
      console.error('Error getting clients:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get clients'
      });
    }
  }

  /**
   * Get performance metrics for all clients
   */
  async getPerformanceMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = this.videoStreamService.getAllPerformanceMetrics();

      res.json({
        success: true,
        metrics,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get performance metrics'
      });
    }
  }

  /**
   * Get performance metrics for a specific client
   */
  async getClientMetrics(req: Request, res: Response): Promise<void> {
    try {
      const clientId = req.params.clientId;
      const metrics = this.videoStreamService.getPerformanceMetrics(clientId);

      if (!metrics) {
        res.status(404).json({
          success: false,
          error: 'Client not found or no metrics available'
        });
        return;
      }

      res.json({
        success: true,
        clientId,
        metrics,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error getting client metrics:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get client metrics'
      });
    }
  }

  /**
   * Get the video service instance for WebSocket handling
   */
  getVideoService(): VideoStreamService {
    return this.videoStreamService;
  }
}

// Export singleton instance
export const videoStreamController = new VideoStreamController();
