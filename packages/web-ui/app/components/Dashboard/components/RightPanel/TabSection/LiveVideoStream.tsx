import { Video24Regular } from '@fluentui/react-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  // For interaction events
  x?: number;
  y?: number;
  text?: string;
  key?: string;
  success?: boolean;
  error?: string;
  // For automation pause/resume
  automationPaused?: boolean;
  automationResumed?: boolean;
}

export const LiveVideoStream: React.FC<LiveVideoStreamProps> = ({ isVisible, sessionId, className, style }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFrame, setCurrentFrame] = useState<string | null>(null);
  const [frameCount, setFrameCount] = useState(0);
  const [actualFps, setActualFps] = useState<number>(0);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>(
    'disconnected',
  );
  const [frameSize, setFrameSize] = useState<number>(0);
  const [avgFrameSize, setAvgFrameSize] = useState<number>(0);
  const [bytesTransferred, setBytesTransferred] = useState<number>(0);
  const [interactionEnabled, setInteractionEnabled] = useState<boolean>(false);
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [showHoverMessage, setShowHoverMessage] = useState<boolean>(false);

  const wsRef = useRef<WebSocket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fpsCounterRef = useRef<number>(0);
  const fpsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hoverMessageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hoverStartedRef = useRef<boolean>(false);

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

    ws.onmessage = event => {
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

    ws.onerror = error => {
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

      case 'interactive_mode_enabled':
        console.log('✅ Interactive mode enabled - automation paused');
        break;

      case 'interactive_mode_disabled':
        console.log('✅ Interactive mode disabled - automation resumed');
        break;

      case 'click_response':
        if (message.success) {
          console.log(`✅ Click successful at (${message.x}, ${message.y})`);
        } else {
          console.error(`❌ Click failed: ${message.error}`);
        }
        break;

      case 'keyboard_response':
        if (message.success) {
          console.log(`✅ Keyboard input successful: "${message.text}"`);
        } else {
          console.error(`❌ Keyboard input failed: ${message.error}`);
        }
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

    wsRef.current.send(
      JSON.stringify({
        type: 'start_stream',
        options: {
          fps: 10,
          quality: 70, // Optimized for performance
          width: 1280,
          height: 720,
          format: 'jpeg', // JPEG is more efficient than PNG
          enableAdaptiveFps: true,
          maxFrameSize: 400, // 400KB max frame size
        },
      }),
    );
  }, []);

  const stopStream = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    wsRef.current.send(
      JSON.stringify({
        type: 'stop_stream',
      }),
    );
  }, []);

  // Send click event to server
  const sendClick = useCallback(
    (x: number, y: number) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !interactionEnabled) {
        return;
      }

      wsRef.current.send(
        JSON.stringify({
          type: 'click_event',
          x,
          y,
          timestamp: Date.now(),
        }),
      );
    },
    [interactionEnabled],
  );

  // Send keyboard event to server
  const sendKeyboard = useCallback(
    (text: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !interactionEnabled) {
        return;
      }

      wsRef.current.send(
        JSON.stringify({
          type: 'keyboard_event',
          text,
          timestamp: Date.now(),
        }),
      );
    },
    [interactionEnabled],
  );

  // Toggle interactive mode
  const toggleInteractiveMode = useCallback(() => {
    const newState = !interactionEnabled;
    setInteractionEnabled(newState);

    // Send toggle message to server
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'toggle_interactive',
          enabled: newState,
          timestamp: Date.now(),
        }),
      );
    }

    console.log(`🔄 Interactive mode ${newState ? 'enabled' : 'disabled'}`);
  }, [interactionEnabled]);

  // Handle canvas click events
  const handleCanvasClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!interactionEnabled || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();

      // Calculate relative coordinates within the actual browser viewport
      const scaleX = canvasSize.width / rect.width;
      const scaleY = canvasSize.height / rect.height;

      const x = (event.clientX - rect.left) * scaleX;
      const y = (event.clientY - rect.top) * scaleY;

      console.log(`📍 Canvas click at: (${Math.round(x)}, ${Math.round(y)})`);
      sendClick(Math.round(x), Math.round(y));
    },
    [interactionEnabled, canvasSize, sendClick],
  );

  // Handle keyboard events (when canvas is focused)
  const handleCanvasKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLCanvasElement>) => {
      if (!interactionEnabled) return;

      // Handle special keys
      if (event.key.length === 1) {
        // Regular character
        sendKeyboard(event.key);
      } else {
        // Special keys like Enter, Tab, etc.
        sendKeyboard(`{${event.key}}`);
      }

      event.preventDefault();
    },
    [interactionEnabled, sendKeyboard],
  );

  // Handle canvas hover for showing interaction hint
  const handleCanvasMouseEnter = useCallback(() => {
    // Only show if ALL conditions are met: not interactive, streaming, connected, and has current frame
    // And if we haven't already started the hover sequence
    if (
      !interactionEnabled &&
      isStreaming &&
      connectionStatus === 'connected' &&
      currentFrame &&
      !hoverStartedRef.current
    ) {
      hoverStartedRef.current = true;
      setShowHoverMessage(true);

      // Clear any existing timeout
      if (hoverMessageTimeoutRef.current) {
        clearTimeout(hoverMessageTimeoutRef.current);
      }

      // Hide message after 3 seconds
      const timeout = setTimeout(() => {
        setShowHoverMessage(false);
        hoverMessageTimeoutRef.current = null;
        hoverStartedRef.current = false;
      }, 3000);
      hoverMessageTimeoutRef.current = timeout;
    }
  }, [interactionEnabled, isStreaming, connectionStatus, currentFrame]);

  const handleCanvasMouseLeave = useCallback(() => {
    // Only hide on actual mouse leave, let the timeout handle the automatic hiding
    // Don't interfere if user is hovering over the message itself
  }, []);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverMessageTimeoutRef.current) {
        clearTimeout(hoverMessageTimeoutRef.current);
        hoverMessageTimeoutRef.current = null;
      }
      hoverStartedRef.current = false;
    };
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

      // Update canvas size state for coordinate calculations
      setCanvasSize({ width: img.width, height: img.height });

      // Draw the frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = currentFrame;
  }, [currentFrame]);

  // Hide hover message when stream stops or conditions change
  useEffect(() => {
    if (showHoverMessage && (!isStreaming || interactionEnabled || connectionStatus !== 'connected' || !currentFrame)) {
      setShowHoverMessage(false);
      hoverStartedRef.current = false;
      if (hoverMessageTimeoutRef.current) {
        clearTimeout(hoverMessageTimeoutRef.current);
        hoverMessageTimeoutRef.current = null;
      }
    }
  }, [isStreaming, interactionEnabled, connectionStatus, currentFrame, showHoverMessage]);

  if (!isVisible) {
    return null;
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return '#22c55e';
      case 'connecting':
        return '#eab308';
      case 'error':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return isStreaming ? 'LIVE' : 'CONNECTED';
      case 'connecting':
        return 'CONNECTING';
      case 'error':
        return 'ERROR';
      default:
        return 'DISCONNECTED';
    }
  };

  return (
    <div style={{ position: 'relative', ...style }} className={className}>
      {/* Video Canvas */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onKeyDown={handleCanvasKeyDown}
        onMouseEnter={handleCanvasMouseEnter}
        onMouseLeave={handleCanvasMouseLeave}
        tabIndex={interactionEnabled ? 0 : -1}
        style={{
          width: '100%',
          height: 'auto',
          borderRadius: '8px',
          border: `1px solid ${interactionEnabled ? '#22c55e' : '#374151'}`,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          backgroundColor: '#000000',
          minHeight: '200px',
          cursor: interactionEnabled ? 'pointer' : 'default',
          outline: interactionEnabled ? '2px solid rgba(34, 197, 94, 0.3)' : 'none',
        }}
        title={interactionEnabled ? 'Click to interact with the browser' : 'Video display only'}
      />

      {/* Hover Message Overlay with Backdrop - Only show when actively streaming */}
      {showHoverMessage && isStreaming && !interactionEnabled && connectionStatus === 'connected' && currentFrame && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              borderRadius: '8px',
              zIndex: 9,
              pointerEvents: 'none', // Don't interfere with mouse events
              transition: 'opacity 0.15s ease-out',
              opacity: showHoverMessage ? 1 : 0,
            }}
          />

          {/* Message */}
          <div
            role='button'
            tabIndex={0}
            onClick={() => {
              // Toggle interactive mode when message is clicked
              toggleInteractiveMode();
              // Hide the message immediately after click
              setShowHoverMessage(false);
              hoverStartedRef.current = false;
              if (hoverMessageTimeoutRef.current) {
                clearTimeout(hoverMessageTimeoutRef.current);
                hoverMessageTimeoutRef.current = null;
              }
            }}
            onKeyDown={e => {
              // Handle Enter and Space key presses for accessibility
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                // Toggle interactive mode when message is activated via keyboard
                toggleInteractiveMode();
                // Hide the message immediately after activation
                setShowHoverMessage(false);
                hoverStartedRef.current = false;
                if (hoverMessageTimeoutRef.current) {
                  clearTimeout(hoverMessageTimeoutRef.current);
                  hoverMessageTimeoutRef.current = null;
                }
              }
            }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              color: 'white',
              padding: '16px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              textAlign: 'center',
              zIndex: 10,
              pointerEvents: 'auto',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'opacity 0.15s ease-out, transform 0.1s ease-out',
              opacity: showHoverMessage ? 1 : 0,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.02)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
            }}
          >
            <div
              style={{
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '16px' }}>🖱️</span>
              <span>Click to {interactionEnabled ? 'disable' : 'enable'} interactive mode</span>
            </div>
            <div style={{ fontSize: '12px', opacity: '0.8' }}>
              {interactionEnabled ? 'Currently in interactive mode' : 'Click here or anywhere on the video'}
            </div>
          </div>
        </>
      )}

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
          gap: '4px',
        }}
      >
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: getStatusColor(),
            animation: isStreaming ? 'pulse 2s infinite' : 'none',
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
            lineHeight: '1.2',
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
            fontSize: '14px',
          }}
        >
          <div style={{ fontSize: '24px', marginBottom: '8px', color: '#6b7280' }}>
            <Video24Regular />
          </div>
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
            maxWidth: '80%',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Interaction mode indicator */}
      {interactionEnabled && (
        <div
          style={{
            position: 'absolute',
            top: '32px',
            right: '8px',
            backgroundColor: 'rgba(249, 115, 22, 0.9)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#22c55e',
              animation: 'pulse 1.5s infinite',
            }}
          />
          INTERACTIVE (AI PAUSED)
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
            gap: '4px',
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
              fontWeight: 'bold',
            }}
          >
            {isStreaming ? '⏹ Stop' : '▶ Start'}
          </button>

          {/* Interaction toggle button */}
          <button
            onClick={toggleInteractiveMode}
            style={{
              backgroundColor: interactionEnabled ? '#f97316' : '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '11px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
            title={
              interactionEnabled
                ? 'Disable click/type interaction (resume automation)'
                : 'Enable click/type interaction (pause automation)'
            }
          >
            {interactionEnabled ? '🖱 ON' : '🖱 OFF'}
          </button>
        </div>
      )}
    </div>
  );
};
