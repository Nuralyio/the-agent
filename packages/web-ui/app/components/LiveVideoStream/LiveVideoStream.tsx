import React, { useEffect, useRef, useState, useCallback } from 'react';

interface LiveVideoStreamProps {
  serverUrl?: string;
  fps?: number;
  autoStart?: boolean;
  onConnectionChange?: (connected: boolean) => void;
  onStreamChange?: (streaming: boolean) => void;
  onError?: (error: string) => void;
}

interface VideoStreamOptions {
  fps?: number;
  quality?: number;
  width?: number;
  height?: number;
}

/**
 * Live video stream component that displays real-time browser video feed
 */
export const LiveVideoStream: React.FC<LiveVideoStreamProps> = ({
  serverUrl = 'ws://localhost:3002',
  fps = 10,
  autoStart = true,
  onConnectionChange,
  onStreamChange,
  onError
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [currentFrame, setCurrentFrame] = useState<string | null>(null);
  const [frameCount, setFrameCount] = useState(0);
  const [lastFrameTime, setLastFrameTime] = useState<number>(0);
  const [actualFps, setActualFps] = useState<number>(0);

  const wsRef = useRef<WebSocket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fpsCounterRef = useRef<number>(0);
  const fpsTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate actual FPS
  useEffect(() => {
    if (fpsTimerRef.current) {
      clearInterval(fpsTimerRef.current);
    }

    fpsTimerRef.current = setInterval(() => {
      setActualFps(fpsCounterRef.current);
      fpsCounterRef.current = 0;
    }, 1000);

    return () => {
      if (fpsTimerRef.current) {
        clearInterval(fpsTimerRef.current);
      }
    };
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus('connecting');
    
    const wsUrl = `${serverUrl}/video-stream`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('📹 Video stream WebSocket connected');
      setIsConnected(true);
      setConnectionStatus('connected');
      onConnectionChange?.(true);

      if (autoStart) {
        startStream();
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        onError?.('Failed to parse server message');
      }
    };

    ws.onclose = () => {
      console.log('📹 Video stream WebSocket disconnected');
      setIsConnected(false);
      setIsStreaming(false);
      setConnectionStatus('disconnected');
      onConnectionChange?.(false);
      onStreamChange?.(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('error');
      onError?.('WebSocket connection error');
    };

    wsRef.current = ws;
  }, [serverUrl, autoStart, onConnectionChange, onStreamChange, onError]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const handleWebSocketMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'connected':
        console.log('📹 Video stream client registered:', message.clientId);
        break;

      case 'stream_started':
        console.log('📹 Video stream started');
        setIsStreaming(true);
        onStreamChange?.(true);
        break;

      case 'stream_stopped':
        console.log('📹 Video stream stopped');
        setIsStreaming(false);
        onStreamChange?.(false);
        break;

      case 'frame':
        // Update frame
        setCurrentFrame(`data:image/png;base64,${message.data}`);
        setFrameCount(prev => prev + 1);
        setLastFrameTime(message.timestamp);
        
        // Increment FPS counter
        fpsCounterRef.current++;
        break;

      case 'error':
        console.error('Stream error:', message.message);
        onError?.(message.message);
        break;

      case 'pong':
        // Handle ping/pong for connection health
        break;

      default:
        console.warn('Unknown message type:', message.type);
    }
  }, [onStreamChange, onError]);

  const startStream = useCallback((options: VideoStreamOptions = {}) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      onError?.('WebSocket not connected');
      return;
    }

    const streamOptions = {
      fps: fps,
      quality: 80,
      width: 1280,
      height: 720,
      ...options
    };

    wsRef.current.send(JSON.stringify({
      type: 'start_stream',
      options: streamOptions
    }));
  }, [fps, onError]);

  const stopStream = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    wsRef.current.send(JSON.stringify({
      type: 'stop_stream'
    }));
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Update canvas when frame changes
  useEffect(() => {
    if (!currentFrame || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Resize canvas to match image
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw the frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = currentFrame;
  }, [currentFrame]);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-500';
      case 'connecting': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return isStreaming ? 'Streaming' : 'Connected';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Connection Error';
      default: return 'Disconnected';
    }
  };

  return (
    <div className="live-video-stream bg-gray-900 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-gray-400">
          <span>FPS: {actualFps}</span>
          <span>Frames: {frameCount}</span>
        </div>
      </div>

      {/* Video Display */}
      <div className="relative bg-black min-h-[400px] flex items-center justify-center">
        {currentFrame ? (
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full object-contain"
            style={{ imageRendering: 'pixelated' }}
          />
        ) : (
          <div className="text-gray-500 text-center">
            <div className="text-4xl mb-2">📹</div>
            <div>
              {isConnected 
                ? (isStreaming ? 'Waiting for video stream...' : 'Click Start Stream to begin')
                : 'Connecting to video stream...'
              }
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            onClick={() => isStreaming ? stopStream() : startStream()}
            disabled={!isConnected}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              !isConnected
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : isStreaming
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isStreaming ? 'Stop Stream' : 'Start Stream'}
          </button>
          
          <button
            onClick={isConnected ? disconnect : connect}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              isConnected
                ? 'bg-gray-600 hover:bg-gray-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isConnected ? 'Disconnect' : 'Connect'}
          </button>
        </div>

        <div className="text-xs text-gray-400">
          {lastFrameTime && `Last frame: ${new Date(lastFrameTime).toLocaleTimeString()}`}
        </div>
      </div>
    </div>
  );
};
