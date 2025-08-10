import React from 'react';
import type { ExecutionStep } from '../../Dashboard.types';
import { styles } from '../../Dashboard.styles';
import { formatTime } from '../../utils/formatting';

interface ExecutionPlanProps {
  currentPlan: ExecutionStep[];
  handleStepClick: (stepIndex: number, step: ExecutionStep) => void;
}

export const ExecutionPlan: React.FC<ExecutionPlanProps> = ({
  currentPlan,
  handleStepClick,
}) => {
  return (
    <div style={styles.executionPlanSection}>
      <div style={styles.executionPlanHeader}>
        <h3 style={styles.executionPlanTitle}>📋 Execution Plan</h3>
      </div>
      <div style={styles.executionPlanContent}>
        {currentPlan.length > 0 ? (
          <div>
            {currentPlan.map((step, index) => (
              <div
                key={step.id}
                style={{
                  ...styles.planStepItem,
                  ...(step.status === 'pending' ? { borderColor: '#6b7280' } : {}),
                  ...(step.status === 'running' ? { borderColor: '#007ACC', backgroundColor: '#0f1a2a' } : {}),
                  ...(step.status === 'completed' ? { borderColor: '#10b981', backgroundColor: '#0f2a1a' } : {}),
                  ...(step.status === 'error' ? { borderColor: '#ef4444', backgroundColor: '#2a0f0f' } : {}),
                  cursor: step.screenshot ? 'pointer' : 'default',
                }}
                onClick={() => step.screenshot && handleStepClick(index, step)}
              >
                <div style={styles.planStepHeader}>
                  <div
                    style={{
                      ...styles.planStepStatus,
                      backgroundColor:
                        step.status === 'pending'
                          ? '#6b7280'
                          : step.status === 'running'
                            ? '#007ACC'
                            : step.status === 'completed'
                              ? '#10b981'
                              : step.status === 'error'
                                ? '#ef4444'
                                : '#6b7280',
                    }}
                  />
                  <div style={styles.planStepTitle}>
                    Step {index + 1}: {step.title}
                  </div>
                </div>
                <div style={styles.planStepDescription}>{step.description}</div>
                {step.timestamp && (
                  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                    {formatTime(step.timestamp)}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.planEmptyState}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
            <div style={{ fontSize: '14px', marginBottom: '8px' }}>No execution plan yet</div>
            <div style={{ fontSize: '12px' }}>Start an automation task to see the execution plan here</div>
          </div>
        )}
      </div>
    </div>
  );
};
