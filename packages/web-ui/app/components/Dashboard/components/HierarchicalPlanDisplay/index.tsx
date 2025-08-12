import React from 'react';
import type { HierarchicalPlan, SubPlan } from '../../Dashboard.types';

interface HierarchicalPlanDisplayProps {
  hierarchicalPlan: HierarchicalPlan;
  onSubPlanClick?: (subPlanIndex: number, subPlan: SubPlan) => void;
}

const styles = {
  container: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #374151',
    borderRadius: '8px',
    padding: '16px',
    margin: '8px 0',
    maxWidth: '95%',
  },
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
  subPlansList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  subPlan: {
    backgroundColor: '#2a2a2a',
    border: '1px solid #4b5563',
    borderRadius: '6px',
    padding: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  subPlanHover: {
    backgroundColor: '#374151',
    borderColor: '#6b7280',
  },
  subPlanHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  subPlanTitle: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  subPlanStatus: {
    fontSize: '12px',
    fontWeight: '500',
    padding: '2px 8px',
    borderRadius: '4px',
    textTransform: 'uppercase' as const,
  },
  subPlanInfo: {
    fontSize: '12px',
    color: '#9ca3af',
    marginBottom: '8px',
  },
  stepsList: {
    marginLeft: '16px',
    paddingLeft: '12px',
    borderLeft: '2px solid #374151',
  },
  step: {
    padding: '6px 0',
    fontSize: '12px',
    color: '#d1d5db',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  stepIcon: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  emptyState: {
    textAlign: 'center' as const,
    color: '#6b7280',
    padding: '32px',
    fontSize: '14px',
  },
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return '#10b981';
    case 'running':
      return '#3b82f6';
    case 'error':
      return '#ef4444';
    default:
      return '#6b7280';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return '✅';
    case 'running':
      return '🔄';
    case 'error':
      return '❌';
    default:
      return '⭕';
  }
};

const getStepStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return '✓';
    case 'running':
      return '▶';
    case 'error':
      return '✗';
    default:
      return '○';
  }
};

export const HierarchicalPlanDisplay: React.FC<HierarchicalPlanDisplayProps> = ({
  hierarchicalPlan,
  onSubPlanClick,
}) => {
  if (!hierarchicalPlan) {
    return (
      <div style={styles.emptyState}>
        No hierarchical plan available. The system will create one for complex tasks.
      </div>
    );
  }

  const handleSubPlanClick = (subPlanIndex: number, subPlan: SubPlan) => {
    onSubPlanClick?.(subPlanIndex, subPlan);
  };

  const completedSubPlans = hierarchicalPlan.subPlans.filter(sp => sp.status === 'completed').length;
  const totalSubPlans = hierarchicalPlan.subPlans.length;
  const progressPercentage = totalSubPlans > 0 ? (completedSubPlans / totalSubPlans) * 100 : 0;

  // Get current action information
  const currentAction = (() => {
    if (hierarchicalPlan.currentSubPlanIndex === undefined || hierarchicalPlan.currentSubPlanIndex < 0) {
      return null;
    }
    
    const currentSubPlan = hierarchicalPlan.subPlans[hierarchicalPlan.currentSubPlanIndex];
    if (!currentSubPlan) return null;
    
    const runningStep = currentSubPlan.steps.find(step => step.status === 'running');
    
    return {
      subPlan: currentSubPlan,
      currentStep: runningStep,
      subPlanIndex: hierarchicalPlan.currentSubPlanIndex
    };
  })();

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>
          🧠 Hierarchical Plan
        </div>
        <div style={styles.objective}>
          {hierarchicalPlan.globalObjective}
        </div>
        <div style={styles.metadata}>
          Strategy: {hierarchicalPlan.planningStrategy} | 
          Progress: {completedSubPlans}/{totalSubPlans} sub-plans completed ({progressPercentage.toFixed(0)}%) | 
          Est. Duration: {Math.round(hierarchicalPlan.totalEstimatedDuration / 1000)}s
        </div>
        
        {/* Current Action Display */}
        {currentAction && (
          <div style={{
            marginTop: '12px',
            padding: '8px 12px',
            backgroundColor: '#1e3a8a',
            borderRadius: '6px',
            border: '1px solid #3b82f6',
          }}>
            <div style={{
              fontSize: '12px',
              color: '#93c5fd',
              marginBottom: '4px',
            }}>
              Currently executing:
            </div>
            <div style={{
              fontSize: '13px',
              color: '#f1f5f9',
              marginBottom: '4px',
              fontWeight: 500,
            }}>
              {currentAction.currentStep ? currentAction.currentStep.title : 'Preparing next step...'}
            </div>
            {currentAction.currentStep && (
              <div style={{
                fontSize: '12px',
                color: '#cbd5e1',
                lineHeight: 1.4,
              }}>
                {currentAction.currentStep.description}
              </div>
            )}
            {/* Current action details */}
            {currentAction.currentStep?.actionType && (
              <div style={{
                marginTop: '8px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                alignItems: 'center',
              }}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: '500',
                  backgroundColor: '#1e293b',
                  color: '#e2e8f0',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: '1px solid #334155',
                }}>
                  Action: {currentAction.currentStep.actionType}
                </div>
                {currentAction.currentStep.target?.description && (
                  <div style={{
                    fontSize: '11px',
                    backgroundColor: '#1e293b',
                    color: '#93c5fd',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: '1px solid #334155',
                  }}>
                    🎯 {currentAction.currentStep.target.description}
                  </div>
                )}
                {currentAction.currentStep.value && (
                  <div style={{
                    fontSize: '11px',
                    backgroundColor: '#1e293b',
                    color: '#86efac',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: '1px solid #334155',
                  }}>
                    💬 "{currentAction.currentStep.value}"
                  </div>
                )}
              </div>
            )}
            <div style={{
              fontSize: '11px',
              color: '#94a3b8',
              marginTop: '8px',
              padding: '4px 8px',
              backgroundColor: '#1e293b',
              borderRadius: '4px',
              display: 'inline-block',
            }}>
              Sub-plan {currentAction.subPlanIndex + 1}/{totalSubPlans}: {currentAction.subPlan.objective}
            </div>
          </div>
        )}
      </div>

      <div style={styles.subPlansList}>
        {hierarchicalPlan.subPlans.map((subPlan, index) => {
          const isActive = hierarchicalPlan.currentSubPlanIndex === index;
          const statusColor = getStatusColor(subPlan.status);
          const statusIcon = getStatusIcon(subPlan.status);

          return (
            <div
              key={subPlan.id}
              style={{
                ...styles.subPlan,
                borderColor: isActive ? '#3b82f6' : '#4b5563',
                backgroundColor: isActive ? '#1e3a8a' : '#374151',
              }}
              onClick={() => handleSubPlanClick(index, subPlan)}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = styles.subPlanHover.backgroundColor;
                  e.currentTarget.style.borderColor = styles.subPlanHover.borderColor;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#374151';
                  e.currentTarget.style.borderColor = '#4b5563';
                }
              }}
            >
              <div style={styles.subPlanHeader}>
                <div style={styles.subPlanTitle}>
                  <span style={{ fontSize: '16px' }}>{statusIcon}</span>
                  Sub-plan {index + 1}: {subPlan.objective}
                </div>
                <div
                  style={{
                    ...styles.subPlanStatus,
                    backgroundColor: statusColor + '20',
                    color: statusColor,
                    border: `1px solid ${statusColor}40`,
                  }}
                >
                  {subPlan.status}
                </div>
              </div>

              <div style={styles.subPlanInfo}>
                {subPlan.steps.length} steps • Priority: {subPlan.priority} • 
                Est: {Math.round(subPlan.estimatedDuration / 1000)}s
              </div>

              {/* Show expanded steps for active sub-plan */}
              {isActive && subPlan.steps.length > 0 && (
                <div style={styles.stepsList}>
                  {subPlan.steps.slice(0, 5).map((step, stepIndex) => (
                    <div key={step.id} style={styles.step}>
                      <div
                        style={{
                          ...styles.stepIcon,
                          backgroundColor: getStatusColor(step.status),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          color: '#ffffff',
                        }}
                      >
                        {getStepStatusIcon(step.status)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontWeight: step.status === 'running' ? '500' : '400',
                          color: step.status === 'running' ? '#ffffff' : '#d1d5db',
                        }}>
                          {step.title}
                        </div>
                        {step.status === 'running' && step.description && (
                          <div style={{
                            fontSize: '11px',
                            color: '#9ca3af',
                            marginTop: '2px',
                          }}>
                            {step.description}
                          </div>
                        )}
                        {/* Action details display */}
                        {step.actionType && (
                          <div style={{
                            fontSize: '10px',
                            color: '#6b7280',
                            marginTop: '4px',
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '4px',
                          }}>
                            <span style={{
                              backgroundColor: '#374151',
                              padding: '2px 6px',
                              borderRadius: '3px',
                              color: '#f3f4f6',
                              fontWeight: '500',
                            }}>
                              {step.actionType}
                            </span>
                            {step.target?.description && (
                              <span style={{
                                backgroundColor: '#1e3a8a',
                                padding: '2px 6px',
                                borderRadius: '3px',
                                color: '#93c5fd',
                              }}>
                                🎯 {step.target.description}
                              </span>
                            )}
                            {step.value && (
                              <span style={{
                                backgroundColor: '#166534',
                                padding: '2px 6px',
                                borderRadius: '3px',
                                color: '#86efac',
                              }}>
                                💬 "{step.value}"
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {subPlan.steps.length > 5 && (
                    <div style={{
                      ...styles.step,
                      color: '#6b7280',
                      fontStyle: 'italic',
                    }}>
                      ... and {subPlan.steps.length - 5} more steps
                    </div>
                  )}
                </div>
              )}

              {/* Show step count for non-active sub-plans */}
              {!isActive && subPlan.steps.length > 0 && (
                <div style={{
                  fontSize: '11px',
                  color: '#9ca3af',
                  marginTop: '4px',
                }}>
                  Click to view {subPlan.steps.length} detailed steps
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
