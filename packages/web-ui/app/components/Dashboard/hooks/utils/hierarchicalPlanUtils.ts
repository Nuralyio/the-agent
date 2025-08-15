import type { ExecutionStep, HierarchicalPlan } from '../../Dashboard.types';
import type { EventData } from '../types/eventStream.types';

/**
 * Updates plan step status
 */
export const updateHierarchicalStepStatus = (
  plan: HierarchicalPlan,
  data: EventData,
  status: ExecutionStep['status'],
  screenshot?: string
): HierarchicalPlan => {
  const targetSubPlanIndex = data.data?.subPlanIndex ?? plan.currentSubPlanIndex;

  if (targetSubPlanIndex === undefined) {
    return plan;
  }

  return {
    ...plan,
    subPlans: plan.subPlans.map((subPlan, subPlanIndex) =>
      subPlanIndex === targetSubPlanIndex ? {
        ...subPlan,
        steps: subPlan.steps.map((step, stepIndex) =>
          stepIndex === (data.data?.stepIndex ?? data.stepIndex) ? {
            ...step,
            status,
            timestamp: new Date(),
            screenshot: screenshot ? `data:image/png;base64,${screenshot}` : step.screenshot,
          } : step
        ),
      } : subPlan
    ),
  };
};

/**
 * Updates sub-plan status
 */
export const updateSubPlanStatus = (
  plan: HierarchicalPlan,
  subPlanIndex: number,
  status: 'running' | 'completed' | 'error'
): HierarchicalPlan => {
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
export const completeHierarchicalPlan = (plan: HierarchicalPlan): HierarchicalPlan => {
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
export const createMainPlanFromHierarchical = (
  hierarchicalPlan: HierarchicalPlan,
  includeCurrentSubPlanSteps = false
): ExecutionStep[] => {
  const subPlanSteps = hierarchicalPlan.subPlans.map((subPlan, index) => ({
    id: index,
    title: `Sub-plan ${index + 1}: ${subPlan.objective}`,
    description: `${subPlan.steps.length} steps • Priority: ${subPlan.priority} • Est: ${Math.round(subPlan.estimatedDuration / 1000)}s`,
    status: subPlan.status,
    timestamp: new Date(),
  }));

  if (!includeCurrentSubPlanSteps) {
    return subPlanSteps;
  }

  const currentSubPlanIndex = hierarchicalPlan.currentSubPlanIndex;
  const currentSubPlan = currentSubPlanIndex !== undefined ? hierarchicalPlan.subPlans[currentSubPlanIndex] : null;

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
