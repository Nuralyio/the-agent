import { useEffect, useState } from 'react';
import type { ChatMessage, ExecutionStep } from '../Dashboard.types';
import { AUTOMATION_SERVER_URL } from '../utils/constants';

interface UseEventStreamProps {
  setCurrentPlan: React.Dispatch<React.SetStateAction<ExecutionStep[]>>;
  setCurrentScreenshot: React.Dispatch<React.SetStateAction<string | null>>;
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  updateLastStepMessage: (status: string) => void;
}

export const useEventStreamSimple = ({
  setCurrentPlan,
  setCurrentScreenshot,
  setChatMessages,
  updateLastStepMessage,
}: UseEventStreamProps) => {
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  const connectToEventStream = () => {
    const newEventSource = new EventSource(`${AUTOMATION_SERVER_URL}/api/execution/stream`);

    newEventSource.onmessage = event => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'execution_start') {
          const message: ChatMessage = {
            id: Date.now(),
            type: 'system',
            text: `🚀 Starting: ${data.task}`,
            timestamp: new Date(),
          };
          setChatMessages(prev => [...prev, message]);
        } else if (data.type === 'execution_event' && data.data.type === 'plan_created') {
          // Create execution plan steps
          const planSteps: ExecutionStep[] = data.data.steps
            ? data.data.steps.map((step: any, index: number) => ({
                id: index,
                title: step.title || step.type || `Step ${index + 1}`,
                description: step.description || 'Executing automation step...',
                status: 'pending' as const,
                timestamp: new Date(),
              }))
            : [];

          setCurrentPlan(planSteps);

          // Add plan message to chat
          const planMessage: ChatMessage = {
            id: Date.now(),
            type: 'plan',
            text: `📋 Execution Plan (${planSteps.length} steps)`,
            timestamp: new Date(),
            steps: planSteps,
          };
          setChatMessages(prev => [...prev, planMessage]);
        } else if (data.type === 'plan_created') {
          // Handle direct plan_created events (fallback)
          const planSteps: ExecutionStep[] = data.steps
            ? data.steps.map((step: any, index: number) => ({
                id: index,
                title: step.title || step.type || `Step ${index + 1}`,
                description: step.description || 'Executing automation step...',
                status: 'pending' as const,
                timestamp: new Date(),
              }))
            : [];

          setCurrentPlan(planSteps);

          // Add plan message to chat
          const planMessage: ChatMessage = {
            id: Date.now(),
            type: 'plan',
            text: `📋 Execution Plan (${planSteps.length} steps)`,
            timestamp: new Date(),
            steps: planSteps,
          };
          setChatMessages(prev => [...prev, planMessage]);
        } else if (data.type === 'execution_event' && data.data.type === 'step_start') {
          // Update plan step status
          setCurrentPlan(prev =>
            prev.map((step, index) =>
              index === data.data.stepIndex ? { ...step, status: 'running' as const, timestamp: new Date() } : step,
            ),
          );

          // Add step message to chat
          const stepMessage: ChatMessage = {
            id: Date.now(),
            type: 'step',
            text: data.data.step?.title || data.data.step?.type || `Step ${data.data.stepIndex + 1}`,
            description: data.data.step?.description || 'Executing step...',
            status: 'running',
            timestamp: new Date(),
          };
          setChatMessages(prev => [...prev, stepMessage]);
        } else if (data.type === 'step_start') {
          // Handle direct step_start events (fallback)
          setCurrentPlan(prev =>
            prev.map((step, index) =>
              index === data.stepIndex ? { ...step, status: 'running' as const, timestamp: new Date() } : step,
            ),
          );

          const stepMessage: ChatMessage = {
            id: Date.now(),
            type: 'step',
            text: data.step?.title || data.step?.type || `Step ${data.stepIndex + 1}`,
            description: data.step?.description || 'Executing step...',
            status: 'running',
            timestamp: new Date(),
          };
          setChatMessages(prev => [...prev, stepMessage]);
        } else if (data.type === 'execution_event' && data.data.type === 'step_complete') {
          // Update plan step status and screenshot
          setCurrentPlan(prev =>
            prev.map((step, index) =>
              index === data.data.stepIndex
                ? {
                    ...step,
                    status: 'completed' as const,
                    timestamp: new Date(),
                    screenshot: data.data.screenshot
                      ? `data:image/png;base64,${data.data.screenshot}`
                      : step.screenshot,
                  }
                : step,
            ),
          );

          // Update current screenshot if available
          if (data.data.screenshot) {
            setCurrentScreenshot(`data:image/png;base64,${data.data.screenshot}`);
          }
        } else if (data.type === 'step_complete') {
          // Update plan step status and screenshot
          setCurrentPlan(prev =>
            prev.map((step, index) =>
              index === data.stepIndex
                ? {
                    ...step,
                    status: 'completed' as const,
                    timestamp: new Date(),
                    screenshot: data.screenshot ? `data:image/png;base64,${data.screenshot}` : step.screenshot,
                  }
                : step,
            ),
          );

          // Update current screenshot if available
          if (data.screenshot) {
            setCurrentScreenshot(`data:image/png;base64,${data.screenshot}`);
          }

          // Update the last step message to completed
          updateLastStepMessage('completed');
        } else if (data.type === 'step_error') {
          // Update plan step status to error
          setCurrentPlan(prev =>
            prev.map((step, index) =>
              index === data.stepIndex ? { ...step, status: 'error' as const, timestamp: new Date() } : step,
            ),
          );
        } else if (data.type === 'execution_complete') {
          const completionMessage: ChatMessage = {
            id: Date.now(),
            type: 'system',
            text: `✅ Automation completed successfully!`,
            timestamp: new Date(),
          };
          setChatMessages(prev => [...prev, completionMessage]);
          newEventSource.close();
        } else if (data.type === 'execution_error') {
          const errorMessage: ChatMessage = {
            id: Date.now(),
            type: 'system',
            text: `❌ Error: ${data.error}`,
            timestamp: new Date(),
          };
          setChatMessages(prev => [...prev, errorMessage]);
          newEventSource.close();
        } else if (data.type === 'page_change') {
          // Update screenshot when page changes
          if (data.screenshot) {
            setCurrentScreenshot(`data:image/png;base64,${data.screenshot}`);
          }
        } else if (data.type === 'screenshot') {
          // Handle dedicated screenshot events
          if (data.screenshot) {
            setCurrentScreenshot(`data:image/png;base64,${data.screenshot}`);
          }
        }
      } catch (error) {
        console.error('Error parsing event data:', error);
      }
    };

    newEventSource.onerror = error => {
      console.error('EventSource failed:', error);
      newEventSource.close();
    };

    setEventSource(newEventSource);

    return newEventSource;
  };

  useEffect(() => {
    // Auto-connect to event stream on mount
    const source = connectToEventStream();
    
    return () => {
      if (source) {
        source.close();
      }
    };
  }, []); // Empty dependency array - only run on mount

  useEffect(() => {
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [eventSource]);

  return {
    connectToEventStream,
  };
};
