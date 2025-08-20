import React from 'react';
import type { ExecutionStep } from '../../../Dashboard.types';

interface ActionDetailsProps {
  step: ExecutionStep;
  size?: 'small' | 'medium';
}

export const ActionDetails: React.FC<ActionDetailsProps> = ({ step, size = 'medium' }) => {
  if (!step.actionType) return null;

  // Helper function to truncate long text
  const truncateText = (text: string, maxLength: number = 50): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const styles = {
    container: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: size === 'small' ? '4px' : '6px',
      alignItems: 'center',
      maxWidth: '100%',
      overflow: 'hidden',
    },
    tag: {
      fontSize: size === 'small' ? '10px' : '11px',
      fontWeight: '500' as const,
      padding: size === 'small' ? '2px 6px' : '3px 8px',
      borderRadius: size === 'small' ? '3px' : '4px',
      border: '1px solid #334155',
      maxWidth: '100%',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap' as const,
      wordBreak: 'break-all' as const,
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
        <div style={{ ...styles.tag, ...styles.targetTag }} title={step.target.description}>
          🎯 {truncateText(step.target.description, 40)}
        </div>
      )}
      {step.value && (
        <div style={{ ...styles.tag, ...styles.valueTag }} title={step.value}>
          💬 "{truncateText(step.value, 30)}"
        </div>
      )}
    </div>
  );
};
