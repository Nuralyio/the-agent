import React, { useState } from 'react';
import { 
  OrganizationRegular, 
  ChevronDown20Regular, 
  ChevronRight20Regular,
  List20Regular,
  Camera20Regular,
  Play20Regular
} from '@fluentui/react-icons';
import type { ChatMessage, ExecutionStep, SubPlan } from '../../../Dashboard.types';
import { styles } from '../../../Dashboard.styles';
import { getStepIcon } from '../../../utils/formatting';

interface HierarchicalPlanBubbleProps {
  message: ChatMessage;
  selectedStepIndex: number | null;
  onStepClick: (stepIndex: number, step: ExecutionStep) => void;
}

export const HierarchicalPlanBubble: React.FC<HierarchicalPlanBubbleProps> = ({ 
  message, 
  selectedStepIndex, 
  onStepClick 
}) => {
  const [expandedSubPlans, setExpandedSubPlans] = useState<Set<string>>(new Set());
  const hierarchicalPlan = message.hierarchicalPlan;

  if (!hierarchicalPlan) {
    return null;
  }

  const toggleSubPlan = (subPlanId: string) => {
    const newExpanded = new Set(expandedSubPlans);
    if (newExpanded.has(subPlanId)) {
      newExpanded.delete(subPlanId);
    } else {
      newExpanded.add(subPlanId);
    }
    setExpandedSubPlans(newExpanded);
  };

  const getSubPlanStatusIcon = (status: string) => {
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

  const getSubPlanProgressPercentage = (subPlan: SubPlan) => {
    if (!subPlan.steps || subPlan.steps.length === 0) return 0;
    const completedSteps = subPlan.steps.filter(step => step.status === 'completed').length;
    return Math.round((completedSteps / subPlan.steps.length) * 100);
  };

  return (
    <div style={styles.planBubble}>
      {/* Header */}
      <div style={styles.planHeader}>
        <OrganizationRegular style={{ marginRight: '8px', fontSize: '16px' }} />
        <span style={styles.planTitle}>{message.text}</span>
      </div>

      {/* Global Objective */}
      <div style={{
        ...styles.planStepDescription,
        marginBottom: '12px',
        fontStyle: 'italic',
        color: '#cbd5e1'
      }}>
        🎯 {hierarchicalPlan.globalObjective}
      </div>

      {/* Strategy Info */}
      <div style={{
        fontSize: '12px',
        color: '#94a3b8',
        marginBottom: '16px',
        padding: '8px',
        backgroundColor: '#1e293b',
        borderRadius: '6px',
        border: '1px solid #334155'
      }}>
        <div>📋 Strategy: {hierarchicalPlan.planningStrategy}</div>
        <div>⏱️ Total Duration: {Math.round(hierarchicalPlan.totalEstimatedDuration / 1000)}s</div>
        <div>📊 Sub-plans: {hierarchicalPlan.subPlans.length}</div>
      </div>

      {/* Sub-plans */}
      <div style={styles.planSteps}>
        {hierarchicalPlan.subPlans.map((subPlan, subPlanIndex) => {
          const isExpanded = expandedSubPlans.has(subPlan.id);
          const isCurrentSubPlan = hierarchicalPlan.currentSubPlanIndex === subPlanIndex;
          const progressPercentage = getSubPlanProgressPercentage(subPlan);

          return (
            <div key={subPlan.id} style={{ marginBottom: '8px' }}>
              {/* Sub-plan header */}
              <div
                style={{
                  ...styles.planStep,
                  ...(subPlan.status === 'running' ? styles.planStepRunning : {}),
                  ...(subPlan.status === 'completed' ? styles.planStepCompleted : {}),
                  ...(subPlan.status === 'error' ? styles.planStepError : {}),
                  ...(isCurrentSubPlan ? { 
                    border: '2px solid #3b82f6',
                    boxShadow: '0 0 8px rgba(59, 130, 246, 0.3)'
                  } : {}),
                  cursor: 'pointer',
                  position: 'relative'
                }}
                onClick={() => toggleSubPlan(subPlan.id)}
              >
                <div style={styles.planStepIcon}>
                  {isExpanded ? (
                    <ChevronDown20Regular style={{ fontSize: '16px' }} />
                  ) : (
                    <ChevronRight20Regular style={{ fontSize: '16px' }} />
                  )}
                </div>
                <div style={styles.planStepContent}>
                  <div style={styles.planStepTitle}>
                    <span style={{ marginRight: '8px' }}>
                      {getSubPlanStatusIcon(subPlan.status)}
                    </span>
                    Sub-plan {subPlanIndex + 1}: {subPlan.objective}
                    {isCurrentSubPlan && (
                      <Play20Regular style={{ 
                        fontSize: '12px', 
                        marginLeft: '8px', 
                        color: '#3b82f6',
                        animation: 'pulse 2s infinite'
                      }} />
                    )}
                  </div>
                  <div style={styles.planStepDescription}>
                    {subPlan.description} • {subPlan.steps.length} steps • Priority: {subPlan.priority}
                  </div>
                  {/* Progress bar */}
                  <div style={{
                    width: '100%',
                    height: '4px',
                    backgroundColor: '#374151',
                    borderRadius: '2px',
                    marginTop: '6px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${progressPercentage}%`,
                      height: '100%',
                      backgroundColor: subPlan.status === 'completed' ? '#10b981' : 
                                     subPlan.status === 'running' ? '#3b82f6' :
                                     subPlan.status === 'error' ? '#ef4444' : '#6b7280',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#9ca3af',
                    marginTop: '2px'
                  }}>
                    {progressPercentage}% complete
                  </div>
                </div>
              </div>

              {/* Sub-plan steps (expanded) */}
              {isExpanded && (
                <div style={{
                  marginLeft: '24px',
                  borderLeft: '2px solid #374151',
                  paddingLeft: '12px',
                  marginTop: '8px'
                }}>
                  {subPlan.steps.map((step, stepIndex) => {
                    const globalStepIndex = subPlanIndex * 1000 + stepIndex; // Create unique global index
                    
                    return (
                      <div
                        key={step.id}
                        style={{
                          ...styles.planStep,
                          ...(step.status === 'running' ? styles.planStepRunning : {}),
                          ...(step.status === 'completed' ? styles.planStepCompleted : {}),
                          ...(step.status === 'error' ? styles.planStepError : {}),
                          ...(selectedStepIndex === globalStepIndex ? styles.planStepSelected : {}),
                          marginBottom: '4px',
                          fontSize: '13px'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onStepClick(globalStepIndex, step);
                        }}
                      >
                        <div style={styles.planStepIcon}>
                          <span style={{ fontSize: '14px' }}>
                            {getStepIcon(step.status, step.id)}
                          </span>
                        </div>
                        <div style={styles.planStepContent}>
                          <div style={{
                            ...styles.planStepTitle,
                            fontSize: '13px'
                          }}>
                            {step.title}
                            {step.screenshot && (
                              <Camera20Regular style={{ 
                                fontSize: '11px', 
                                marginLeft: '8px', 
                                color: '#9ca3af' 
                              }} />
                            )}
                          </div>
                          <div style={{
                            ...styles.planStepDescription,
                            fontSize: '12px'
                          }}>
                            {step.description}
                          </div>
                          {/* Action details display */}
                          {step.actionType && (
                            <div style={{
                              marginTop: '4px',
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '4px',
                            }}>
                              <span style={{
                                fontSize: '10px',
                                backgroundColor: '#374151',
                                color: '#f3f4f6',
                                padding: '2px 6px',
                                borderRadius: '3px',
                                fontWeight: '500',
                              }}>
                                {step.actionType}
                              </span>
                              {step.target?.description && (
                                <span style={{
                                  fontSize: '10px',
                                  backgroundColor: '#1e3a8a',
                                  color: '#93c5fd',
                                  padding: '2px 6px',
                                  borderRadius: '3px',
                                }}>
                                  🎯 {step.target.description}
                                </span>
                              )}
                              {step.value && (
                                <span style={{
                                  fontSize: '10px',
                                  backgroundColor: '#166534',
                                  color: '#86efac',
                                  padding: '2px 6px',
                                  borderRadius: '3px',
                                }}>
                                  💬 "{step.value}"
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
