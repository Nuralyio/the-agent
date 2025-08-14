import type { ChatMessage, ExecutionStep, HierarchicalPlan } from '../../Dashboard.types';
import type { EventData } from '../types/eventStream.types';

/**
 * Creates execution plan steps from raw step data
 */
export const createPlanSteps = (steps: any[]): ExecutionStep[] => {
  return steps.map((step: any, index: number) => ({
    id: index,
    title: step.title || step.type || `Step ${index + 1}`,
    description: step.description || 'Executing automation step...',
    status: 'pending' as const,
    timestamp: new Date(),
    actionType: step.type,
    target: step.target,
    value: step.value,
  }));
};

/**
 * Creates a chat message for plan creation
 */
export const createPlanMessage = (planSteps: ExecutionStep[]): ChatMessage => ({
  id: Date.now(),
  type: 'plan',
  text: `Execution Plan (${planSteps.length} steps)`,
  timestamp: new Date(),
  steps: planSteps,
});

/**
 * Creates a hierarchical plan from event data
 */
export const createHierarchicalPlan = (data: EventData): HierarchicalPlan => {
  const planData = data.data?.hierarchicalPlan || data;

  return {
    id: planData?.id || 'hierarchical-plan',
    globalObjective: data.data?.globalObjective || planData?.globalObjective || 'Complex task execution',
    subPlans: (planData?.subPlans || []).map((subPlan: any, index: number) => ({
      id: subPlan.id || `sub-plan-${index}`,
      objective: subPlan.objective,
      description: subPlan.description,
      steps: (subPlan.steps || []).map((step: any, stepIndex: number) => ({
        id: stepIndex,
        title: step.title || step.type || `Step ${stepIndex + 1}`,
        description: step.description || 'Executing step...',
        status: 'pending' as const,
        timestamp: new Date(),
        actionType: step.type,
        target: step.target,
        value: step.value,
      })),
      estimatedDuration: subPlan.estimatedDuration || 0,
      priority: subPlan.priority || index + 1,
      status: 'pending' as const,
      dependencies: subPlan.dependencies || [],
    })),
    totalEstimatedDuration: planData?.totalEstimatedDuration || 0,
    planningStrategy: data.data?.planningStrategy || planData?.planningStrategy || 'sequential',
    currentSubPlanIndex: 0,
    status: 'pending' as const,
    metadata: planData?.metadata,
  };
};

/**
 * Creates sub-plan overview steps for main plan display
 */
export const createSubPlanSteps = (hierarchicalPlan: HierarchicalPlan): ExecutionStep[] => {
  return hierarchicalPlan.subPlans.map((subPlan, index) => ({
    id: index,
    title: `Sub-plan ${index + 1}: ${subPlan.objective}`,
    description: `${subPlan.steps.length} steps • Priority: ${subPlan.priority} • Est: ${Math.round(subPlan.estimatedDuration / 1000)}s`,
    status: 'pending' as const,
    timestamp: new Date(),
  }));
};

/**
 * Creates a hierarchical plan chat message
 */
export const createHierarchicalPlanMessage = (hierarchicalPlan: HierarchicalPlan): ChatMessage => ({
  id: Date.now(),
  type: 'hierarchical_plan',
  text: `🧠 Hierarchical Plan: ${hierarchicalPlan.globalObjective} (${hierarchicalPlan.subPlans.length} sub-plans)`,
  timestamp: new Date(),
  hierarchicalPlan,
});

/**
 * Creates a step message for chat
 */
export const createStepMessage = (data: EventData, status: 'running' | 'completed' = 'running'): ChatMessage => {
  const stepData = data.data?.step || data.step;
  const stepIndex = data.data?.stepIndex ?? data.stepIndex ?? 0;

  return {
    id: Date.now(),
    type: 'step',
    text: stepData?.title || stepData?.type || `Step ${stepIndex + 1}`,
    description: stepData?.description || 'Executing step...',
    status,
    timestamp: new Date(),
  };
};

/**
 * Formats screenshot data with proper base64 prefix
 */
export const formatScreenshot = (screenshot: string): string => {
  return `data:image/png;base64,${screenshot}`;
};

/**
 * Creates or extends execution plan based on step data
 */
export const createOrExtendPlan = (
  currentPlan: ExecutionStep[],
  stepIndex: number,
  stepData: any,
  status: ExecutionStep['status'],
  screenshot?: string
): ExecutionStep[] => {
  // If no plan exists, create one from the step
  if (currentPlan.length === 0) {
    return [{
      id: stepIndex,
      title: stepData?.title || stepData?.type || `Step ${stepIndex + 1}`,
      description: stepData?.description || getStatusDescription(status),
      status,
      timestamp: new Date(),
      screenshot: screenshot ? formatScreenshot(screenshot) : undefined,
      actionType: stepData?.type,
      target: stepData?.target,
      value: stepData?.value,
    }];
  }

  // Extend plan if step index is beyond current plan
  if (stepIndex >= currentPlan.length) {
    const newSteps = [...currentPlan];
    for (let i = currentPlan.length; i <= stepIndex; i++) {
      newSteps.push({
        id: i,
        title: i === stepIndex ?
          (stepData?.title || stepData?.type || `Step ${i + 1}`) :
          `Step ${i + 1}`,
        description: i === stepIndex ?
          (stepData?.description || getStatusDescription(status)) :
          'Pending step...',
        status: i === stepIndex ? status : 'pending',
        timestamp: new Date(),
        screenshot: i === stepIndex && screenshot ? formatScreenshot(screenshot) : undefined,
        actionType: i === stepIndex ? stepData?.type : undefined,
        target: i === stepIndex ? stepData?.target : undefined,
        value: i === stepIndex ? stepData?.value : undefined,
      });
    }
    return newSteps;
  }

  // Update existing step
  return currentPlan.map((step, index) =>
    index === stepIndex ? {
      ...step,
      status,
      timestamp: new Date(),
      title: stepData?.title || step.title,
      description: stepData?.description || step.description,
      screenshot: screenshot ? formatScreenshot(screenshot) : step.screenshot,
      actionType: stepData?.type || step.actionType,
      target: stepData?.target || step.target,
      value: stepData?.value || step.value,
    } : step
  );
};

/**
 * Gets description based on step status
 */
const getStatusDescription = (status: ExecutionStep['status']): string => {
  switch (status) {
    case 'running':
      return 'Executing step...';
    case 'completed':
      return 'Completed step';
    case 'error':
      return 'Step failed';
    default:
      return 'Pending step...';
  }
};
