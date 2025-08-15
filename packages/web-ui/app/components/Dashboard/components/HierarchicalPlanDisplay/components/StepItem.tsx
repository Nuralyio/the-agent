import React from 'react';
import type { ExecutionStep } from '../../../Dashboard.types';
import { STATUS_COLORS, STEP_STATUS_ICONS, type StatusType } from '../constants';
import { ActionDetails } from './ActionDetails';

interface StepItemProps {
  step: ExecutionStep;
  isActive?: boolean;
  onStepClick?: (step: ExecutionStep) => void;
}

const getStatusColor = (status: string): string => {
  return STATUS_COLORS[status as StatusType] || STATUS_COLORS.default;
};

const getStepStatusIcon = (status: string): string => {
  return STEP_STATUS_ICONS[status as StatusType] || STEP_STATUS_ICONS.default;
};

export const StepItem: React.FC<StepItemProps> = ({ step, isActive = false, onStepClick }) => {
  const statusColor = getStatusColor(step.status);
  const hasScreenshot = step.screenshot && step.screenshot !== '';
  const isClickable = hasScreenshot && onStepClick;

  const styles = {
    container: {
      padding: '6px 0',
      fontSize: '12px',
      color: '#d1d5db',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      cursor: isClickable ? 'pointer' : 'default',
      transition: 'background-color 0.2s ease',
      borderRadius: '4px',
      ':hover': isClickable ? {
        backgroundColor: '#374151',
      } : {},
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
    screenshotIndicator: {
      fontSize: '10px',
      color: '#60a5fa',
      marginLeft: '4px',
    },
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isClickable) {
      e.stopPropagation(); // Prevent sub-plan click when clicking on action
      onStepClick(step);
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isClickable) {
      e.currentTarget.style.backgroundColor = '#374151';
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isClickable) {
      e.currentTarget.style.backgroundColor = 'transparent';
    }
  };

  return (
    <div 
      style={styles.container}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div style={styles.icon}>{getStepStatusIcon(step.status)}</div>
      <div style={styles.content}>
        <div style={styles.title}>
          {step.title}
          {hasScreenshot && <span style={styles.screenshotIndicator}>📷</span>}
        </div>
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
