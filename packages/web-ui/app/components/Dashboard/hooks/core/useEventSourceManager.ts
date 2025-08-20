import { useCallback } from 'react';
import { AUTOMATION_SERVER_URL } from '../../utils/constants';
import { EventHandlers } from '../handlers/EventHandlers';
import type { EventData, UseEventStreamProps } from '../types/eventStream.types';

/**
 * Custom hook for managing EventSource connection and message parsing
 */
export const useEventSourceManager = (props: UseEventStreamProps) => {
  const eventHandlers = new EventHandlers(props);

  /**
   * Parses and handles incoming event messages
   */
  const handleMessage = useCallback((event: MessageEvent, eventSource: EventSource) => {
    try {
      const data: EventData = JSON.parse(event.data);

      switch (data.type) {
        case 'execution_start':
          eventHandlers.handleExecutionStart(data);
          break;

        case 'execution_event':
          handleExecutionEvent(data, eventSource);
          break;

        case 'plan_created':
          eventHandlers.handlePlanCreated(data);
          break;

        case 'step_start':
          eventHandlers.handleStepStart(data);
          break;

        case 'step_complete':
          eventHandlers.handleStepComplete(data);
          break;

        case 'step_error':
          eventHandlers.handleStepError(data);
          break;

        case 'sub_plan_completed':
          eventHandlers.handleSubPlanCompleted(data);
          break;

        case 'execution_complete':
          eventHandlers.handleExecutionComplete(eventSource);
          break;

        case 'execution_error':
          eventHandlers.handleExecutionError(data, eventSource);
          break;

        case 'page_change':
          eventHandlers.handlePageChange(data);
          break;

        case 'screenshot':
          eventHandlers.handleScreenshot(data);
          break;

        default:
          console.warn('Unhandled event type:', data.type);
      }
    } catch (error) {
      console.error('Error parsing event data:', error);
    }
  }, [eventHandlers]);

  /**
   * Handles nested execution events
   */
  const handleExecutionEvent = useCallback((data: EventData, eventSource: EventSource) => {
    if (!data.data?.type) return;

    switch (data.data.type) {
      case 'plan_created':
        eventHandlers.handlePlanCreated(data);
        break;

      case 'execution_plan_created':
        eventHandlers.handleExecutionPlanCreated(data);
        break;

      case 'step_start':
        eventHandlers.handleStepStart(data);
        break;

      case 'step_complete':
        eventHandlers.handleStepComplete(data);
        break;

      case 'sub_plan_start':
        eventHandlers.handleSubPlanStart(data);
        break;

      case 'sub_plan_completed':
        eventHandlers.handleSubPlanCompleted(data);
        break;

      default:
        console.warn('Unhandled execution event type:', data.data.type);
    }
  }, [eventHandlers]);

  /**
   * Handles EventSource errors
   */
  const handleError = useCallback((error: Event, eventSource: EventSource) => {
    console.error('EventSource failed:', error);
    eventSource.close();
  }, []);

  /**
   * Creates and configures a new EventSource connection
   */
  const createEventSource = useCallback((): EventSource => {
    const eventSource = new EventSource(`${AUTOMATION_SERVER_URL}/api/execution/stream`);

    eventSource.onmessage = (event) => handleMessage(event, eventSource);
    eventSource.onerror = (error) => handleError(error, eventSource);

    return eventSource;
  }, [handleMessage, handleError]);

  return {
    createEventSource,
  };
};
