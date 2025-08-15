import React from 'react';
import type { ExecutionStep, TabItem, HierarchicalPlan } from '../../Dashboard.types';
import { styles } from '../../Dashboard.styles';
import { ExecutionPlan } from './ExecutionPlan';
import { TabSection } from './TabSection/index';

interface RightPanelProps {
  currentPlan: ExecutionStep[];
  currentHierarchicalPlan?: HierarchicalPlan | null;
  isLoading?: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabs: TabItem[];
  selectedStepIndex: number | null;
  setSelectedStepIndex: (index: number | null) => void;
  getDisplayScreenshot: () => string | null;
  selectedEngine: string;
  handleStepClick: (stepIndex: number, step: ExecutionStep) => void;
}

export default function RightPanel({
  currentPlan,
  currentHierarchicalPlan,
  isLoading = false,
  activeTab,
  setActiveTab,
  tabs,
  selectedStepIndex,
  setSelectedStepIndex,
  getDisplayScreenshot,
  selectedEngine,
  handleStepClick,
}: RightPanelProps) {
  return (
    <div style={styles.rightPanel}>
      {/* Execution Plan Section */}
      <ExecutionPlan
        currentHierarchicalPlan={currentHierarchicalPlan}
        isLoading={isLoading}
      />

      {/* Tab Section */}
      <TabSection
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={tabs}
        selectedStepIndex={selectedStepIndex}
        setSelectedStepIndex={setSelectedStepIndex}
        getDisplayScreenshot={getDisplayScreenshot}
        selectedEngine={selectedEngine}
        currentPlan={currentPlan}
      />
    </div>
  );
};
