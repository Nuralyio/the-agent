import type { ExecutionStep, ExecutionPlan } from '../../Dashboard.types';
import type { EventData } from '../types/eventStream.types';

/**
 * Updates plan step status
 */
export const updateExecutionStepStatus = (
  plan: ExecutionPlan,
  data: EventData,
  status: ExecutionStep['status'],
  screenshot?: string
): ExecutionPlan => {
  const targetSubPlanIndex = data.data?.subPlanIndex ?? data.subPlanIndex ?? plan.currentSubPlanIndex;
  const stepIndex = data.data?.stepIndex ?? data.stepIndex;
  const stepData = data.data?.step || data.step;

  if (targetSubPlanIndex === undefined || stepIndex === undefined) {
    return plan;
  }

  if (targetSubPlanIndex < 0 || targetSubPlanIndex >= plan.subPlans.length) {
    return plan;
  }

  return {
    ...plan,
    subPlans: plan.subPlans.map((subPlan, subPlanIndex) => {
      if (subPlanIndex !== targetSubPlanIndex) {
        return subPlan;
      }

      // Ensure we have enough steps in the array
      const updatedSteps = [...subPlan.steps];

      // If the step doesn't exist, create it
      if (stepIndex >= updatedSteps.length) {
        // Fill missing steps with placeholder steps
        for (let i = updatedSteps.length; i <= stepIndex; i++) {
          updatedSteps.push({
            id: i,
            title: stepData?.title || stepData?.description || `Step ${i + 1}`,
            description: stepData?.description || 'Executing step...',
            status: 'pending',
            timestamp: new Date(),
            actionType: stepData?.type,
            target: stepData?.target,
            value: stepData?.value,
          });
        }
      }

      // Update the specific step
      updatedSteps[stepIndex] = {
        ...updatedSteps[stepIndex],
        ...(stepData && {
          title: stepData.title || stepData.description || updatedSteps[stepIndex].title,
          description: stepData.description || updatedSteps[stepIndex].description,
          actionType: stepData.type || updatedSteps[stepIndex].actionType,
          target: stepData.target || updatedSteps[stepIndex].target,
          value: stepData.value || updatedSteps[stepIndex].value,
        }),
        status,
        timestamp: new Date(),
        screenshot: screenshot ? `data:image/png;base64,${screenshot}` : updatedSteps[stepIndex].screenshot,
      };

      return {
        ...subPlan,
        steps: updatedSteps,
      };
    }),
  };
};

/**
 * Updates sub-plan status
 */
export const updateSubPlanStatus = (
  plan: ExecutionPlan,
  subPlanIndex: number,
  status: 'running' | 'completed' | 'error'
): ExecutionPlan => {
  return {
    ...plan,
    currentSubPlanIndex: status === 'running' ? subPlanIndex : plan.currentSubPlanIndex,
    status: status === 'running' ? 'running' : plan.status,
    subPlans: plan.subPlans.map((subPlan, index) => {
      if (index === subPlanIndex) {
        return { ...subPlan, status };
      } else if (index < subPlanIndex && status === 'running') {
        // Mark all previous sub-plans as completed when starting a new one
        return { ...subPlan, status: 'completed' as const };
      }
      return subPlan;
    }),
  };
};

/**
 * Marks plan as completed
 */
export const completeExecutionPlan = (plan: ExecutionPlan): ExecutionPlan => {
  return {
    ...plan,
    status: 'completed',
    subPlans: plan.subPlans.map(subPlan => ({
      ...subPlan,
      status: subPlan.status === 'running' ? 'completed' as const : subPlan.status,
    })),
  };
};

/**
 * Creates main plan display from plan
 */
export const createMainPlanFromExecution = (
  executionPlan: ExecutionPlan,
  includeCurrentSubPlanSteps = false
): ExecutionStep[] => {
  const subPlanSteps = executionPlan.subPlans.map((subPlan, index) => ({
    id: index,
    title: `Sub-plan ${index + 1}: ${subPlan.objective}`,
    description: `${subPlan.steps.length} steps • Priority: ${subPlan.priority} • Est: ${Math.round(subPlan.estimatedDuration / 1000)}s`,
    status: subPlan.status,
    timestamp: new Date(),
  }));

  if (!includeCurrentSubPlanSteps) {
    return subPlanSteps;
  }

  const currentSubPlanIndex = executionPlan.currentSubPlanIndex;
  const currentSubPlan = currentSubPlanIndex !== undefined ? executionPlan.subPlans[currentSubPlanIndex] : null;

  const currentSubPlanSteps: ExecutionStep[] = currentSubPlan ?
    currentSubPlan.steps.map((step, stepIndex) => ({
      id: 1000 + stepIndex,
      title: `  └─ ${step.title}`,
      description: step.description,
      status: step.status,
      timestamp: step.timestamp || new Date(),
      screenshot: step.screenshot,
    })) : [];

  return [...subPlanSteps, ...currentSubPlanSteps];
};
