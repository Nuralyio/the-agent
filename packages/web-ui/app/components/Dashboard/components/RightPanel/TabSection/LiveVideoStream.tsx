import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AUTOMATION_SERVER_URL } from '../../../utils/constants';

interface LiveVideoStreamProps {
  isVisible: boolean;
  sessionId?: string;
  className?: string;
  style?: React.CSSProperties;
}

interface VideoStreamMessage {
  type: string;
  data?: string;
  timestamp?: number;
  fps?: number;
  message?: string;
  clientId?: string;
  frameSize?: number;
  format?: string;
  options?: any;
}

export const LiveVideoStream: React.FC<LiveVideoStreamProps> = ({
  isVisible,
  sessionId,
  className,
  style
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFrame, setCurrentFrame] = useState<string | null>(null);
  const [frameCount, setFrameCount] = useState(0);
  const [actualFps, setActualFps] = useState<number>(0);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [frameSize, setFrameSize] = useState<number>(0);
  const [avgFrameSize, setAvgFrameSize] = useState<number>(0);
  const [bytesTransferred, setBytesTransferred] = useState<number>(0);

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
    setError(null);
    
    // Use the automation server URL and convert to WebSocket
    const wsUrl = AUTOMATION_SERVER_URL.replace('http://', 'ws://').replace('https://', 'wss://');
    const fullWsUrl = `${wsUrl}/video-stream`;
    
    console.log('📹 Connecting to video stream:', fullWsUrl);
    const ws = new WebSocket(fullWsUrl);

    ws.onopen = () => {
      console.log('📹 Video stream WebSocket connected');
      setIsConnected(true);
      setConnectionStatus('connected');
      setError(null);

      // Auto-start streaming when connected and visible
      if (isVisible) {
        startStream();
      }
    };

    ws.onmessage = (event) => {
      try {
        const message: VideoStreamMessage = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        setError('Failed to parse server message');
      }
    };

    ws.onclose = () => {
      console.log('📹 Video stream WebSocket disconnected');
      setIsConnected(false);
      setIsStreaming(false);
      setConnectionStatus('disconnected');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('error');
      setError('Connection failed');
    };

    wsRef.current = ws;
  }, [isVisible]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsStreaming(false);
    setConnectionStatus('disconnected');
  }, []);

  const handleWebSocketMessage = useCallback((message: VideoStreamMessage) => {
    switch (message.type) {
      case 'connected':
        console.log('📹 Video stream client registered:', message.clientId);
        break;

      case 'stream_started':
        console.log('📹 Video stream started');
        setIsStreaming(true);
        setError(null);
        break;

      case 'stream_stopped':
        console.log('📹 Video stream stopped');
        setIsStreaming(false);
        break;

      case 'frame':
        if (message.data) {
          setCurrentFrame(`data:image/png;base64,${message.data}`);
          setFrameCount(prev => prev + 1);
          fpsCounterRef.current++;
          
          // Update performance metrics
          if (message.frameSize) {
            setFrameSize(message.frameSize);
            setBytesTransferred(prev => prev + (message.frameSize || 0));
          }
        }
        break;

      case 'error':
        console.error('Stream error:', message.message);
        setError(message.message || 'Stream error');
        break;

      default:
        console.warn('Unknown message type:', message.type);
    }
  }, []);

  const startStream = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError('WebSocket not connected');
      return;
    }

    wsRef.current.send(JSON.stringify({
      type: 'start_stream',
      options: {
        fps: 10,
        quality: 70, // Optimized for performance
        width: 1280,
        height: 720,
        format: 'jpeg', // JPEG is more efficient than PNG
        enableAdaptiveFps: true,
        maxFrameSize: 400 // 400KB max frame size
      }
    }));
  }, []);

  const stopStream = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    wsRef.current.send(JSON.stringify({
      type: 'stop_stream'
    }));
  }, []);

  // Auto-connect when component becomes visible
  useEffect(() => {
    if (isVisible) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isVisible, connect, disconnect]);

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

  if (!isVisible) {
    return null;
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#22c55e';
      case 'connecting': return '#eab308';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return isStreaming ? 'LIVE' : 'CONNECTED';
      case 'connecting': return 'CONNECTING';
      case 'error': return 'ERROR';
      default: return 'DISCONNECTED';
    }
  };

  return (
    <div style={{ position: 'relative', ...style }} className={className}>
      {/* Video Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: 'auto',
          borderRadius: '8px',
          border: '1px solid #374151',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          backgroundColor: '#000000',
          minHeight: '200px'
        }}
      />

      {/* Status Overlay */}
      <div
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          backgroundColor: `${getStatusColor()}E6`, // E6 = 90% opacity
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: getStatusColor(),
            animation: isStreaming ? 'pulse 2s infinite' : 'none'
          }}
        />
        {getStatusText()}
      </div>

      {/* FPS Counter */}
      {isStreaming && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 'bold',
          }}
        >
          {actualFps} FPS
        </div>
      )}

      {/* Performance Metrics */}
      {isStreaming && frameSize > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '32px',
            left: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            lineHeight: '1.2'
          }}
        >
          <div>{frameSize}KB/frame</div>
          <div>{Math.round(bytesTransferred / 1024)}KB total</div>
        </div>
      )}

      {/* Frame Counter */}
      {isStreaming && frameCount > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
          }}
        >
          Frame #{frameCount}
        </div>
      )}

      {/* Placeholder when not streaming */}
      {!currentFrame && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '14px'
          }}
        >
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>�</div>
          <div>
            {connectionStatus === 'connecting' && 'Connecting to video stream...'}
            {connectionStatus === 'connected' && !isStreaming && 'Ready to stream'}
            {connectionStatus === 'connected' && isStreaming && 'Waiting for video frames...'}
            {connectionStatus === 'error' && 'Connection failed'}
            {connectionStatus === 'disconnected' && 'Disconnected'}
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(239, 68, 68, 0.9)',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            textAlign: 'center',
            maxWidth: '80%'
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Control buttons */}
      {isConnected && (
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            left: '8px',
            display: 'flex',
            gap: '4px'
          }}
        >
          <button
            onClick={isStreaming ? stopStream : startStream}
            style={{
              backgroundColor: isStreaming ? '#ef4444' : '#22c55e',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '11px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {isStreaming ? '⏹ Stop' : '▶ Start'}
          </button>
        </div>
      )}
    </div>
  );
};
