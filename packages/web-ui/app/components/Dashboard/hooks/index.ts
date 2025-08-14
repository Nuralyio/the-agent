// Main hook export
export { useEventStreamSimple } from './useEventStreamSimple';

// Type exports
export type {
  EventData,
  EventSourceHookReturn, UseEventStreamProps
} from './types/eventStream.types';

// Utility exports for potential reuse
export {
  createHierarchicalPlan, createHierarchicalPlanMessage, createOrExtendPlan, createPlanMessage, createPlanSteps, createStepMessage, createSubPlanSteps, formatScreenshot
} from './utils/planUtils';

export {
  completeHierarchicalPlan,
  createMainPlanFromHierarchical, updateHierarchicalStepStatus,
  updateSubPlanStatus
} from './utils/hierarchicalPlanUtils';

export {
  createErrorMessage, createExecutionCompleteMessage, createExecutionStartMessage, createSubPlanCompletionMessage, createSystemMessage
} from './utils/messageUtils';

