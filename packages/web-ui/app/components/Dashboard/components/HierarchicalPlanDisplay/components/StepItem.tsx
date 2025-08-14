import React from 'react';
import type { ExecutionStep } from '../../../Dashboard.types';
import { STATUS_COLORS, STEP_STATUS_ICONS, type StatusType } from '../constants';
import { ActionDetails } from './ActionDetails';

interface StepItemProps {
  step: ExecutionStep;
  isActive?: boolean;
}

const getStatusColor = (status: string): string => {
  return STATUS_COLORS[status as StatusType] || STATUS_COLORS.default;
};

const getStepStatusIcon = (status: string): string => {
  return STEP_STATUS_ICONS[status as StatusType] || STEP_STATUS_ICONS.default;
};

export const StepItem: React.FC<StepItemProps> = ({ step, isActive = false }) => {
  const statusColor = getStatusColor(step.status);

  const styles = {
    container: {
      padding: '6px 0',
      fontSize: '12px',
      color: '#d1d5db',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    icon: {
      width: '16px',
      height: '16px',
      borderRadius: '50%',
      flexShrink: 0,
      backgroundColor: statusColor,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '10px',
      color: '#ffffff',
    },
    content: {
      flex: 1,
    },
    title: {
      fontWeight: step.status === 'running' ? '500' : '400',
      color: step.status === 'running' ? '#ffffff' : '#d1d5db',
    },
    description: {
      fontSize: '11px',
      color: '#9ca3af',
      marginTop: '2px',
    },
    actionDetails: {
      marginTop: '4px',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.icon}>{getStepStatusIcon(step.status)}</div>
      <div style={styles.content}>
        <div style={styles.title}>{step.title}</div>
        {step.status === 'running' && step.description && <div style={styles.description}>{step.description}</div>}
        {step.actionType && (
          <div style={styles.actionDetails}>
            <ActionDetails step={step} size='small' />
          </div>
        )}
      </div>
    </div>
  );
};
