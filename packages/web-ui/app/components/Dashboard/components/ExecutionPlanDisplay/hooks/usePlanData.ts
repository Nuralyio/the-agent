import type { ExecutionPlan } from '../../../Dashboard.types';

/**
 * Hook to get current action information from execution plan
 */
export const useCurrentAction = (executionPlan: ExecutionPlan) => {
  if (
    executionPlan.currentSubPlanIndex === undefined ||
    executionPlan.currentSubPlanIndex < 0
  ) {
    return null;
  }

  const currentSubPlan = executionPlan.subPlans[executionPlan.currentSubPlanIndex];
  if (!currentSubPlan) return null;

  const runningStep = currentSubPlan.steps.find(step => step.status === 'running');

  return {
    subPlan: currentSubPlan,
    currentStep: runningStep,
    subPlanIndex: executionPlan.currentSubPlanIndex
  };
};

/**
 * Hook to calculate plan progress statistics
 */
export const usePlanProgress = (executionPlan: ExecutionPlan) => {
  const completedSubPlans = executionPlan.subPlans.filter(sp => sp.status === 'completed').length;
  const totalSubPlans = executionPlan.subPlans.length;
  const progressPercentage = totalSubPlans > 0 ? (completedSubPlans / totalSubPlans) * 100 : 0;

  return {
    completedSubPlans,
    totalSubPlans,
    progressPercentage,
  };
};
