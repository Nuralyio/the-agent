import React from 'react';
import type { HierarchicalPlan } from '../../../Dashboard.types';

interface PlanHeaderProps {
  hierarchicalPlan: HierarchicalPlan;
  completedSubPlans: number;
  totalSubPlans: number;
}

export const PlanHeader: React.FC<PlanHeaderProps> = ({ hierarchicalPlan, completedSubPlans, totalSubPlans }) => {
  const progressPercentage = totalSubPlans > 0 ? (completedSubPlans / totalSubPlans) * 100 : 0;

  const styles = {
    header: {
      marginBottom: '16px',
      paddingBottom: '12px',
      borderBottom: '1px solid #374151',
    },
    title: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#10b981',
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    objective: {
      fontSize: '14px',
      color: '#e5e7eb',
      marginBottom: '8px',
      lineHeight: '1.4',
    },
    metadata: {
      fontSize: '12px',
      color: '#9ca3af',
      lineHeight: '1.3',
    },
  };

  return (
    <div style={styles.header}>
      {/* <div style={styles.objective}>{hierarchicalPlan.globalObjective}</div> */}
      <div style={styles.metadata}>
        Strategy: {hierarchicalPlan.planningStrategy} | Progress: {completedSubPlans}/{totalSubPlans} sub-plans
        completed ({progressPercentage.toFixed(0)}%) | Est. Duration:{' '}
        {Math.round(hierarchicalPlan.totalEstimatedDuration / 1000)}s
      </div>
    </div>
  );
};
