import React from 'react';
import type { HierarchicalPlan, SubPlan } from '../../Dashboard.types';
import { CurrentActionDisplay } from './components/CurrentActionDisplay';
import { EmptyState } from './components/EmptyState';
import { PlanHeader } from './components/PlanHeader';
import { SubPlanItem } from './components/SubPlanItem';
import { useCurrentAction, usePlanProgress } from './hooks/usePlanData';

interface HierarchicalPlanDisplayProps {
  hierarchicalPlan: HierarchicalPlan;
  onSubPlanClick?: (subPlanIndex: number, subPlan: SubPlan) => void;
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
}) => {
  if (!hierarchicalPlan) {
    return <EmptyState />;
  }

  const currentAction = useCurrentAction(hierarchicalPlan);
  const { completedSubPlans, totalSubPlans } = usePlanProgress(hierarchicalPlan);

  const handleSubPlanClick = (subPlanIndex: number, subPlan: SubPlan) => {
    onSubPlanClick?.(subPlanIndex, subPlan);
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
            />
          );
        })}
      </div>
    </div>
  );
};
