import React from 'react';
import type { ExecutionPlan } from '../../../Dashboard.types';

interface PlanHeaderProps {
  executionPlan: ExecutionPlan;
  completedSubPlans: number;
  totalSubPlans: number;
}

export const PlanHeader: React.FC<PlanHeaderProps> = ({ executionPlan, completedSubPlans, totalSubPlans }) => {
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
      {/* <div style={styles.objective}>{executionPlan.globalObjective}</div> */}
      <div style={styles.metadata}>
        Strategy: {executionPlan.planningStrategy} | Progress: {completedSubPlans}/{totalSubPlans} sub-plans
        completed ({progressPercentage.toFixed(0)}%) | Est. Duration:{' '}
        {Math.round(executionPlan.totalEstimatedDuration / 1000)}s
      </div>
    </div>
  );
};
