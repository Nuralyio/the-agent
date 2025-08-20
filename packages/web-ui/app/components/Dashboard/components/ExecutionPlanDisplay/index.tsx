import React from 'react';
import type { ExecutionPlan, SubPlan, ExecutionStep } from '../../Dashboard.types';
import { CurrentActionDisplay } from './components/CurrentActionDisplay';
import { EmptyState } from './components/EmptyState';
import { PlanHeader } from './components/PlanHeader';
import { SubPlanItem } from './components/SubPlanItem';
import { useCurrentAction, usePlanProgress } from './hooks/usePlanData';

interface ExecutionPlanDisplayProps {
  executionPlan: ExecutionPlan;
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
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
    wordWrap: 'break-word' as const,
    overflowWrap: 'break-word' as const,
  },
  subPlansList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    width: '100%',
    overflow: 'hidden',
  },
};

export const ExecutionPlanDisplay: React.FC<ExecutionPlanDisplayProps> = ({
  executionPlan,
  onSubPlanClick,
  onStepClick,
}) => {
  if (!executionPlan) {
    return <EmptyState />;
  }

  const currentAction = useCurrentAction(executionPlan);
  const { completedSubPlans, totalSubPlans } = usePlanProgress(executionPlan);

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
        executionPlan={executionPlan}
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
        {executionPlan.subPlans.map((subPlan, index) => {
          const isActive = executionPlan.currentSubPlanIndex === index;

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
