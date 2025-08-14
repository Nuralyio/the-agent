import React from 'react';
import { List20Regular, OrganizationRegular } from '@fluentui/react-icons';
import type { ExecutionStep, HierarchicalPlan } from '../../Dashboard.types';
import { styles } from '../../Dashboard.styles';
import { formatTime } from '../../utils/formatting';
import { HierarchicalPlanDisplay } from '../HierarchicalPlanDisplay';

interface ExecutionPlanProps {
  currentPlan: ExecutionStep[];
  currentHierarchicalPlan?: HierarchicalPlan | null;
  handleStepClick: (stepIndex: number, step: ExecutionStep) => void;
}

export const ExecutionPlan: React.FC<ExecutionPlanProps> = ({
  currentPlan,
  currentHierarchicalPlan,
  handleStepClick,
}) => {
  return (
    <div style={styles.executionPlanSection}>
      <div style={styles.executionPlanHeader}>
        <h3 style={styles.executionPlanTitle}>
          {currentHierarchicalPlan ? (
            <OrganizationRegular style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          ) : (
            <List20Regular style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          )}
          {currentHierarchicalPlan ? 'Hierarchical Execution Plan' : 'Execution Plan'}
        </h3>
      </div>
      <div style={styles.executionPlanContent}>
        {currentHierarchicalPlan ? (
          <HierarchicalPlanDisplay
            hierarchicalPlan={currentHierarchicalPlan}
            onSubPlanClick={(subPlanIndex, subPlan) => {
              // Handle sub-plan click if needed
            }}
          />
        ) : currentPlan.length > 0 ? (
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
                {/* Action details display */}
                {step.actionType && (
                  <div style={{
                    marginTop: '8px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    alignItems: 'center',
                  }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '500',
                      backgroundColor: '#374151',
                      color: '#f3f4f6',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      border: '1px solid #4b5563',
                    }}>
                      {step.actionType.toUpperCase()}
                    </span>
                    {step.target?.description && (
                      <span style={{
                        fontSize: '11px',
                        backgroundColor: '#1e3a8a',
                        color: '#93c5fd',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: '1px solid #3b82f6',
                      }}>
                        🎯 {step.target.description}
                      </span>
                    )}
                    {step.value && (
                      <span style={{
                        fontSize: '11px',
                        backgroundColor: '#166534',
                        color: '#86efac',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: '1px solid #16a34a',
                      }}>
                        💬 "{step.value}"
                      </span>
                    )}
                    {step.target?.selector && (
                      <span style={{
                        fontSize: '10px',
                        backgroundColor: '#713f12',
                        color: '#fbbf24',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        border: '1px solid #a16207',
                        fontFamily: 'monospace',
                      }}>
                        {step.target.selector}
                      </span>
                    )}
                  </div>
                )}
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
            <List20Regular style={{ fontSize: '32px', marginBottom: '12px', color: '#6b7280' }} />
            <div style={{ fontSize: '14px', marginBottom: '8px' }}>No execution plan yet</div>
            <div style={{ fontSize: '12px' }}>Start an automation task to see the execution plan here</div>
          </div>
        )}
      </div>
    </div>
  );
};
