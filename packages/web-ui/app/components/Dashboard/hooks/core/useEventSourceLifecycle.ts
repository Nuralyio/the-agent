import { useCallback, useEffect, useRef } from 'react';

/**
 * Custom hook for managing EventSource lifecycle
 */
export const useEventSourceLifecycle = (createEventSource: () => EventSource) => {
  const eventSourceRef = useRef<EventSource | null>(null);

  /**
   * Connects to the event stream
   */
  const connectToEventStream = useCallback((): EventSource => {
    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Create new connection
    const newEventSource = createEventSource();
    eventSourceRef.current = newEventSource;

    return newEventSource;
  }, [createEventSource]);

  /**
   * Disconnects from the event stream
   */
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  /**
   * Auto-connect on mount and cleanup on unmount
   */
  useEffect(() => {
    const source = connectToEventStream();

    return () => {
      source.close();
    };
  }, [connectToEventStream]);

  /**
   * Cleanup on component unmount
   */
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connectToEventStream,
    disconnect,
    isConnected: () => eventSourceRef.current !== null,
  };
};
