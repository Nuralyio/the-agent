import React from 'react';
import type { ChatMessage, ExecutionStep } from '../../../Dashboard.types';
import { styles } from '../../../Dashboard.styles';
import { getStepIcon } from '../../../utils/formatting';

interface PlanBubbleProps {
  message: ChatMessage;
  selectedStepIndex: number | null;
  onStepClick: (stepIndex: number, step: ExecutionStep) => void;
}

export const PlanBubble: React.FC<PlanBubbleProps> = ({ message, selectedStepIndex, onStepClick }) => {
  return (
    <div style={styles.planBubble}>
      <div style={styles.planHeader}>
        <span>📋</span>
        <span style={styles.planTitle}>{message.text}</span>
      </div>
      <div style={styles.planSteps}>
        {message.steps?.map((step, stepIndex) => (
          <div
            key={step.id}
            style={{
              ...styles.planStep,
              ...(step.status === 'running' ? styles.planStepRunning : {}),
              ...(step.status === 'completed' ? styles.planStepCompleted : {}),
              ...(step.status === 'error' ? styles.planStepError : {}),
              ...(selectedStepIndex === stepIndex ? styles.planStepSelected : {}),
            }}
            onClick={() => onStepClick(stepIndex, step)}
            onMouseOver={e => {
              if (selectedStepIndex !== stepIndex) {
                e.currentTarget.style.backgroundColor = '#4b5563';
              }
            }}
            onMouseOut={e => {
              if (selectedStepIndex !== stepIndex) {
                if (step.status === 'running') {
                  e.currentTarget.style.backgroundColor = '#1e40af';
                } else if (step.status === 'completed') {
                  e.currentTarget.style.backgroundColor = '#166534';
                } else if (step.status === 'error') {
                  e.currentTarget.style.backgroundColor = '#7f1d1d';
                } else {
                  e.currentTarget.style.backgroundColor = '#374151';
                }
              }
            }}
          >
            <div style={styles.planStepIcon}>{getStepIcon(step.status, step.id)}</div>
            <div style={styles.planStepContent}>
              <div style={styles.planStepTitle}>
                {step.title}
                {step.screenshot && (
                  <span style={{ fontSize: '11px', marginLeft: '8px', color: '#9ca3af' }}>📷</span>
                )}
              </div>
              <div style={styles.planStepDescription}>{step.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
