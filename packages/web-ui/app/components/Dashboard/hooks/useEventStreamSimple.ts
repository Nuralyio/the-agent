import { useEventSourceLifecycle } from './core/useEventSourceLifecycle';
import { useEventSourceManager } from './core/useEventSourceManager';
import type { EventSourceHookReturn, UseEventStreamProps } from './types/eventStream.types';

/**
 * Main hook for managing EventSource communication with automation server
 * Handles real-time updates for execution plans, steps, and hierarchical plans
 *
 * Features:
 * - Automatic connection management with cleanup
 * - Type-safe event handling
 * - Modular, maintainable architecture
 * - Error handling and recovery
 * - Memory leak prevention
 *
 * @param props - Configuration object with state setters and callbacks
 * @returns Object containing connection control functions
 */
export const useEventStreamSimple = (props: UseEventStreamProps): EventSourceHookReturn => {
  // Core event source management
  const { createEventSource } = useEventSourceManager(props);

  // Lifecycle management with auto-connect and cleanup
  const { connectToEventStream } = useEventSourceLifecycle(createEventSource);

  return {
    connectToEventStream,
  };
};
