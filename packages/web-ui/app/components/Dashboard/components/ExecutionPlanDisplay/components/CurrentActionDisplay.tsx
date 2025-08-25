import React from 'react';
import type { SubPlan } from '../../../Dashboard.types';
import { ActionDetails } from './ActionDetails';

interface CurrentActionDisplayProps {
  subPlan: SubPlan;
  subPlanIndex: number;
  totalSubPlans: number;
}

export const CurrentActionDisplay: React.FC<CurrentActionDisplayProps> = ({ subPlan, subPlanIndex, totalSubPlans }) => {
  const runningStep = subPlan.steps.find(step => step.status === 'running');

  const styles = {
    container: {
      marginTop: '12px',
      marginBottom: '12px',
      padding: '8px 12px',
      backgroundColor: '#1e3a8a',
      borderRadius: '6px',
      border: '1px solid #3b82f6',
    },
    label: {
      fontSize: '12px',
      color: '#93c5fd',
      marginBottom: '4px',
    },
    stepTitle: {
      fontSize: '13px',
      color: '#f1f5f9',
      marginBottom: '4px',
      fontWeight: 500,
    },
    stepDescription: {
      fontSize: '12px',
      color: '#cbd5e1',
      lineHeight: 1.4,
    },
    actionDetails: {
      marginTop: '8px',
    },
    subPlanInfo: {
      fontSize: '11px',
      color: '#94a3b8',
      marginTop: '8px',
      padding: '4px 8px',
      backgroundColor: '#1e293b',
      borderRadius: '4px',
      display: 'inline-block',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.label}>Currently executing:</div>
      <div style={styles.stepTitle}>{runningStep ? runningStep.title : 'Preparing next step...'}</div>
      {runningStep && runningStep.description && <div style={styles.stepDescription}>{runningStep.description}</div>}
      {runningStep && (
        <div style={styles.actionDetails}>
          <ActionDetails step={runningStep} />
        </div>
      )}
      <div style={styles.subPlanInfo}>
        Sub-plan {subPlanIndex + 1}/{totalSubPlans}: {subPlan.objective}
      </div>
    </div>
  );
};
