import React from 'react';
import type { ExecutionStep } from '../../../Dashboard.types';

interface ActionDetailsProps {
  step: ExecutionStep;
  size?: 'small' | 'medium';
}

export const ActionDetails: React.FC<ActionDetailsProps> = ({ step, size = 'medium' }) => {
  if (!step.actionType) return null;

  const styles = {
    container: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: size === 'small' ? '4px' : '6px',
      alignItems: 'center',
    },
    tag: {
      fontSize: size === 'small' ? '10px' : '11px',
      fontWeight: '500' as const,
      padding: size === 'small' ? '2px 6px' : '3px 8px',
      borderRadius: size === 'small' ? '3px' : '4px',
      border: '1px solid #334155',
    },
    actionTag: {
      backgroundColor: '#1e293b',
      color: '#e2e8f0',
    },
    targetTag: {
      backgroundColor: '#1e293b',
      color: '#93c5fd',
    },
    valueTag: {
      backgroundColor: '#1e293b',
      color: '#86efac',
    },
  };

  return (
    <div style={styles.container}>
      <div style={{ ...styles.tag, ...styles.actionTag }}>Action: {step.actionType}</div>
      {step.target?.description && (
        <div style={{ ...styles.tag, ...styles.targetTag }}>🎯 {step.target.description}</div>
      )}
      {step.value && <div style={{ ...styles.tag, ...styles.valueTag }}>💬 "{step.value}"</div>}
    </div>
  );
};
