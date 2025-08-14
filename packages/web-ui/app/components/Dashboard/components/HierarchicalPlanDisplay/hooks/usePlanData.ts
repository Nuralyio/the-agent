import type { HierarchicalPlan } from '../../../Dashboard.types';

/**
 * Hook to get current action information from hierarchical plan
 */
export const useCurrentAction = (hierarchicalPlan: HierarchicalPlan) => {
  if (
    hierarchicalPlan.currentSubPlanIndex === undefined ||
    hierarchicalPlan.currentSubPlanIndex < 0
  ) {
    return null;
  }

  const currentSubPlan = hierarchicalPlan.subPlans[hierarchicalPlan.currentSubPlanIndex];
  if (!currentSubPlan) return null;

  const runningStep = currentSubPlan.steps.find(step => step.status === 'running');

  return {
    subPlan: currentSubPlan,
    currentStep: runningStep,
    subPlanIndex: hierarchicalPlan.currentSubPlanIndex
  };
};

/**
 * Hook to calculate plan progress statistics
 */
export const usePlanProgress = (hierarchicalPlan: HierarchicalPlan) => {
  const completedSubPlans = hierarchicalPlan.subPlans.filter(sp => sp.status === 'completed').length;
  const totalSubPlans = hierarchicalPlan.subPlans.length;
  const progressPercentage = totalSubPlans > 0 ? (completedSubPlans / totalSubPlans) * 100 : 0;

  return {
    completedSubPlans,
    totalSubPlans,
    progressPercentage,
  };
};
