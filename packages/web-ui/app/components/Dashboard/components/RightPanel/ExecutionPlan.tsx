import React from 'react';
import { OrganizationRegular } from '@fluentui/react-icons';
import type { HierarchicalPlan, ExecutionStep } from '../../Dashboard.types';
import { styles } from '../../Dashboard.styles';
import { HierarchicalPlanDisplay } from '../HierarchicalPlanDisplay';

interface ExecutionPlanProps {
  currentHierarchicalPlan?: HierarchicalPlan | null;
  isLoading?: boolean;
  handleStepClick?: (stepIndex: number, step: ExecutionStep) => void;
}

export const ExecutionPlan: React.FC<ExecutionPlanProps> = ({
  currentHierarchicalPlan,
  isLoading = false,
  handleStepClick,
}) => {
  return (
    <div style={styles.executionPlanSection}>
      <div style={styles.executionPlanHeader}>
        <h3 style={styles.executionPlanTitle}>
          <OrganizationRegular style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Execution Plan
        </h3>
      </div>
      <div style={styles.executionPlanContent}>
        {isLoading ? (
          <div style={styles.planEmptyState}>
            <div
              style={{
                width: '24px',
                height: '24px',
                border: '2px solid #6b7280',
                borderTop: '2px solid #007ACC',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '12px',
              }}
            />
            <div style={{ fontSize: '14px', marginBottom: '8px' }}>Preparing plan...</div>
            <div style={{ fontSize: '12px' }}>Please wait while we analyze your request</div>
          </div>
        ) : currentHierarchicalPlan ? (
          <HierarchicalPlanDisplay
            hierarchicalPlan={currentHierarchicalPlan}
            onSubPlanClick={(subPlanIndex, subPlan) => {
              // Handle sub-plan click if needed
            }}
            onStepClick={handleStepClick}
          />
        ) : (
          <div style={styles.planEmptyState}>
            <OrganizationRegular style={{ fontSize: '32px', marginBottom: '12px', color: '#6b7280' }} />
            <div style={{ fontSize: '14px', marginBottom: '8px' }}>No execution plan yet</div>
            <div style={{ fontSize: '12px' }}>Start an automation task to see the execution plan here</div>
          </div>
        )}
      </div>
    </div>
  );
};
