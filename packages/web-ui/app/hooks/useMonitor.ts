import { useEffect, useRef, useState } from 'react';

export interface ExecutionEvent {
  type: 'plan_created' | 'step_start' | 'step_complete' | 'step_error' | 'screenshot' | 'page_change' | 'execution_complete';
  stepIndex?: number;
  step?: any;
  totalSteps?: number;
  screenshot?: string;
  url?: string;
  title?: string;
  error?: string;
  timestamp: string;
  sessionId: string;
}

export interface ExecutionStep {
  index: number;
  action: string;
  message: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  startTime?: string;
  endTime?: string;
  hasScreenshot?: boolean;
}

export interface ExecutionSession {
  sessionId: string;
  startTime: string;
  endTime?: string;
  totalSteps: number;
  completedSteps: number;
  status: 'active' | 'completed' | 'failed';
  steps: ExecutionStep[];
}

export interface MonitorState {
  currentSession?: ExecutionSession;
  sessions: ExecutionSession[];
  connectedClients: number;
  serverStatus: 'starting' | 'running' | 'stopping' | 'stopped';
}

export function useMonitorStream(serverUrl: string = 'http://localhost:3002') {
  const [state, setState] = useState<MonitorState>({
    sessions: [],
    connectedClients: 0,
    serverStatus: 'stopped'
  });

  const [currentScreenshot, setCurrentScreenshot] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const connectToStream = () => {
      try {
        const eventSource = new EventSource(`${serverUrl}/api/execution/stream`);
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          setState(prev => ({ ...prev, serverStatus: 'running' }));
        };

        eventSource.onmessage = (event) => {
          try {
            const data: ExecutionEvent = JSON.parse(event.data);
            handleExecutionEvent(data);
          } catch (error) {
            console.error('Failed to parse execution event:', error);
          }
        };

        eventSource.onerror = () => {
          setState(prev => ({ ...prev, serverStatus: 'stopped' }));
          // Attempt to reconnect after a delay
          setTimeout(connectToStream, 3000);
        };

      } catch (error) {
        console.error('Failed to connect to monitor stream:', error);
        setTimeout(connectToStream, 3000);
      }
    };

    const handleExecutionEvent = (event: ExecutionEvent) => {
      setState(prev => {
        const newState = { ...prev };

        // Find or create session
        let session = newState.sessions.find(s => s.sessionId === event.sessionId);
        if (!session) {
          session = {
            sessionId: event.sessionId,
            startTime: event.timestamp,
            totalSteps: 0,
            completedSteps: 0,
            status: 'active',
            steps: []
          };
          newState.sessions = [...newState.sessions, session];
        }

        // Update current session
        newState.currentSession = session;

        switch (event.type) {
          case 'plan_created':
            session.totalSteps = event.totalSteps || 0;
            break;

          case 'step_start':
            if (event.step && event.stepIndex !== undefined) {
              const existingStepIndex = session.steps.findIndex(s => s.index === event.stepIndex);
              const step: ExecutionStep = {
                index: event.stepIndex,
                action: event.step.type || event.step.action,
                message: event.step.description || event.step.message,
                status: 'active',
                startTime: event.timestamp
              };

              if (existingStepIndex >= 0) {
                session.steps[existingStepIndex] = step;
              } else {
                session.steps.push(step);
              }
              session.steps.sort((a, b) => a.index - b.index);
            }
            break;

          case 'step_complete':
            if (event.stepIndex !== undefined) {
              const step = session.steps.find(s => s.index === event.stepIndex);
              if (step) {
                step.status = 'completed';
                step.endTime = event.timestamp;
                step.hasScreenshot = !!event.screenshot;
                session.completedSteps++;
              }

              if (event.screenshot) {
                setCurrentScreenshot(event.screenshot);
              }
            }
            break;

          case 'step_error':
            if (event.stepIndex !== undefined) {
              const step = session.steps.find(s => s.index === event.stepIndex);
              if (step) {
                step.status = 'failed';
                step.endTime = event.timestamp;
              }
              session.status = 'failed';
            }
            break;

          case 'screenshot':
            if (event.screenshot) {
              setCurrentScreenshot(event.screenshot);
            }
            break;

          case 'execution_complete':
            session.status = 'completed';
            session.endTime = event.timestamp;
            break;
        }

        return newState;
      });
    };

    connectToStream();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [serverUrl]);

  return {
    state,
    currentScreenshot
  };
}

export function useMonitorAPI(serverUrl: string = 'http://localhost:3002') {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchServerStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${serverUrl}/api/execution/status`);
      if (!response.ok) throw new Error('Failed to fetch server status');
      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${serverUrl}/api/execution/sessions`);
      if (!response.ok) throw new Error('Failed to fetch sessions');
      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const executeTask = async (instruction: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${serverUrl}/api/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ instruction }),
      });

      if (!response.ok) throw new Error('Failed to execute task');
      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    fetchServerStatus,
    fetchSessions,
    executeTask
  };
}
