import React, { useState } from 'react';
import type { SubPlan, ExecutionStep } from '../../../Dashboard.types';
import { StatusBadge } from './StatusBadge';
import { StepItem } from './StepItem';

interface SubPlanItemProps {
  subPlan: SubPlan;
  index: number;
  isActive: boolean;
  onClick: () => void;
  onStepClick?: (stepIndex: number, step: ExecutionStep) => void;
}

export const SubPlanItem: React.FC<SubPlanItemProps> = ({ subPlan, index, isActive, onClick, onStepClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isCompleted = subPlan.status === 'completed';
  
  const styles = {
    container: {
      backgroundColor: isActive ? '#1e3a8a' : '#374151',
      border: `1px solid ${isActive ? '#3b82f6' : '#4b5563'}`,
      borderRadius: '6px',
      padding: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '8px',
      gap: '8px', // Add gap to ensure spacing
    },
    title: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      flex: 1, // Allow title to take available space
      minWidth: 0, // Allow text to truncate if needed
      overflow: 'hidden', // Hide overflow
      textOverflow: 'ellipsis', // Add ellipsis for long text
      whiteSpace: 'nowrap', // Prevent line breaks
    },
    info: {
      fontSize: '12px',
      color: '#9ca3af',
      marginBottom: '8px',
    },
    stepsList: {
      marginLeft: '16px',
      paddingLeft: '12px',
      borderLeft: '2px solid #374151',
    },
    clickPrompt: {
      fontSize: '11px',
      color: '#9ca3af',
      marginTop: '4px',
    },
    moreSteps: {
      padding: '6px 0',
      fontSize: '12px',
      color: '#6b7280',
      fontStyle: 'italic',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    expandButton: {
      padding: '4px 8px',
      fontSize: '11px',
      backgroundColor: 'transparent',
      border: '1px solid #4b5563',
      borderRadius: '4px',
      color: '#9ca3af',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isActive) {
      e.currentTarget.style.backgroundColor = '#4b5563';
      e.currentTarget.style.borderColor = '#6b7280';
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isActive) {
      e.currentTarget.style.backgroundColor = '#374151';
      e.currentTarget.style.borderColor = '#4b5563';
    }
  };

  const handleContainerClick = () => {
    // Allow clicking on both active and completed sub-plans
    onClick();
  };

  const handleExpandToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div style={styles.container} onClick={handleContainerClick} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <div style={styles.header}>
        <div style={styles.title}>
          Sub-plan {index + 1}: {subPlan.objective}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isCompleted && subPlan.steps.length > 0 && (
            <button
              style={styles.expandButton}
              onClick={handleExpandToggle}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#4b5563';
                e.currentTarget.style.borderColor = '#6b7280';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = '#4b5563';
              }}
            >
              {isExpanded ? '▲' : '▼'} {isExpanded ? 'Hide' : 'Show'} Actions
            </button>
          )}
          <StatusBadge status={subPlan.status} />
        </div>
      </div>

      <div style={styles.info}>
        {subPlan.steps.length} steps • Priority: {subPlan.priority} • Est:{' '}
        {Math.round(subPlan.estimatedDuration / 1000)}s
      </div>

      {/* Show expanded steps for active sub-plan (always expanded when running) */}
      {isActive && subPlan.steps.length > 0 && (
        <div style={styles.stepsList}>
          {subPlan.steps.slice(0, 5).map((step, stepIndex) => (
            <StepItem 
              key={step.id} 
              step={step} 
              isActive={isActive} 
              onStepClick={onStepClick ? (step) => onStepClick(stepIndex, step) : undefined}
            />
          ))}
          {subPlan.steps.length > 5 && (
            <div style={styles.moreSteps}>... and {subPlan.steps.length - 5} more steps</div>
          )}
        </div>
      )}

      {/* Show expanded steps for completed sub-plan when toggled */}
      {isCompleted && isExpanded && subPlan.steps.length > 0 && (
        <div style={styles.stepsList}>
          {subPlan.steps.slice(0, 5).map((step, stepIndex) => (
            <StepItem 
              key={step.id} 
              step={step} 
              isActive={false} 
              onStepClick={onStepClick ? (step) => onStepClick(stepIndex, step) : undefined}
            />
          ))}
          {subPlan.steps.length > 5 && (
            <div style={styles.moreSteps}>... and {subPlan.steps.length - 5} more steps</div>
          )}
        </div>
      )}

      {/* Show step count for non-active, non-completed sub-plans */}
      {!isActive && !isCompleted && subPlan.steps.length > 0 && (
        <div style={styles.clickPrompt}>Click to view {subPlan.steps.length} detailed steps</div>
      )}
    </div>
  );
};
