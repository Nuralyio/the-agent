// Main hook export
export { useEventStreamSimple } from './useEventStreamSimple';

// Type exports
export type {
  EventData,
  EventSourceHookReturn, UseEventStreamProps
} from './types/eventStream.types';

// Utility exports for potential reuse
export {
  createExecutionPlan, createExecutionPlanMessage, createOrExtendPlan, createPlanMessage, createPlanSteps, createStepMessage, createSubPlanSteps, formatScreenshot
} from './utils/planUtils';

export {
  completeExecutionPlan,
  createMainPlanFromExecution, updateExecutionStepStatus,
  updateSubPlanStatus
} from './utils/executionPlanUtils';

export {
  createErrorMessage, createExecutionCompleteMessage, createExecutionStartMessage, createSubPlanCompletionMessage, createSystemMessage
} from './utils/messageUtils';

