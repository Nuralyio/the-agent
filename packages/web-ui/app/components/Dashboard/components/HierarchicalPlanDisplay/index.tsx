import React from 'react';
import type { HierarchicalPlan, SubPlan, ExecutionStep } from '../../Dashboard.types';
import { CurrentActionDisplay } from './components/CurrentActionDisplay';
import { EmptyState } from './components/EmptyState';
import { PlanHeader } from './components/PlanHeader';
import { SubPlanItem } from './components/SubPlanItem';
import { useCurrentAction, usePlanProgress } from './hooks/usePlanData';

interface HierarchicalPlanDisplayProps {
  hierarchicalPlan: HierarchicalPlan;
  onSubPlanClick?: (subPlanIndex: number, subPlan: SubPlan) => void;
  onStepClick?: (stepIndex: number, step: ExecutionStep) => void;
}

const styles = {
  container: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #374151',
    borderRadius: '8px',
    padding: '16px',
    margin: '8px 0',
    maxWidth: '95%',
  },
  subPlansList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
};

export const HierarchicalPlanDisplay: React.FC<HierarchicalPlanDisplayProps> = ({
  hierarchicalPlan,
  onSubPlanClick,
  onStepClick,
}) => {
  if (!hierarchicalPlan) {
    return <EmptyState />;
  }

  const currentAction = useCurrentAction(hierarchicalPlan);
  const { completedSubPlans, totalSubPlans } = usePlanProgress(hierarchicalPlan);

  const handleSubPlanClick = (subPlanIndex: number, subPlan: SubPlan) => {
    onSubPlanClick?.(subPlanIndex, subPlan);
    
    // Auto-select first action with screenshot when clicking on sub-plan
    if (onStepClick && subPlan.steps.length > 0) {
      const firstStepWithScreenshot = subPlan.steps.find(step => step.screenshot && step.screenshot !== '');
      if (firstStepWithScreenshot) {
        const stepIndex = subPlan.steps.indexOf(firstStepWithScreenshot);
        onStepClick(stepIndex, firstStepWithScreenshot);
      }
    }
  };

  return (
    <div style={styles.container}>
      <PlanHeader
        hierarchicalPlan={hierarchicalPlan}
        completedSubPlans={completedSubPlans}
        totalSubPlans={totalSubPlans}
      />

      {currentAction && (
        <CurrentActionDisplay
          subPlan={currentAction.subPlan}
          subPlanIndex={currentAction.subPlanIndex}
          totalSubPlans={totalSubPlans}
        />
      )}

      <div style={styles.subPlansList}>
        {hierarchicalPlan.subPlans.map((subPlan, index) => {
          const isActive = hierarchicalPlan.currentSubPlanIndex === index;

          return (
            <SubPlanItem
              key={subPlan.id}
              subPlan={subPlan}
              index={index}
              isActive={isActive}
              onClick={() => handleSubPlanClick(index, subPlan)}
              onStepClick={onStepClick}
            />
          );
        })}
      </div>
    </div>
  );
};
