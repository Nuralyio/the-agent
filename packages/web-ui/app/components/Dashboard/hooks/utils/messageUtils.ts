import type { ChatMessage } from '../../Dashboard.types';
import type { EventData } from '../types/eventStream.types';

/**
 * Creates system messages for various events
 */
export const createSystemMessage = (text: string): ChatMessage => ({
  id: Date.now(),
  type: 'system',
  text,
  timestamp: new Date(),
});

/**
 * Creates execution start message
 */
export const createExecutionStartMessage = (task: string): ChatMessage =>
  createSystemMessage(`Starting: ${task}`);

/**
 * Creates execution completion message
 */
export const createExecutionCompleteMessage = (): ChatMessage =>
  createSystemMessage('Automation completed successfully!');

/**
 * Creates error message
 */
export const createErrorMessage = (error: string): ChatMessage =>
  createSystemMessage(`Error: ${error}`);

/**
 * Creates sub-plan completion message
 */
export const createSubPlanCompletionMessage = (data: EventData): ChatMessage => {
  const status = data.data?.success === false || data.success === false ? 'failed' : 'completed';
  const subPlanIndex = data.data?.subPlanIndex ?? data.subPlanIndex ?? 0;
  const totalSubPlans = data.data?.totalSubPlans ?? data.totalSubPlans;
  const objective = data.data?.subPlan?.objective ?? data.subPlan?.objective ?? 'Sub-plan execution';

  const text = totalSubPlans ?
    `✅ Sub-plan ${subPlanIndex + 1}/${totalSubPlans} ${status}: ${objective}` :
    `✅ Sub-plan ${subPlanIndex + 1} ${status}: ${objective}`;

  return createSystemMessage(text);
};
