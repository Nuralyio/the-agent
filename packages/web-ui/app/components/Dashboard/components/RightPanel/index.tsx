import React from 'react';
import type { ExecutionStep, TabItem } from '../../Dashboard.types';
import { styles } from '../../Dashboard.styles';
import { ExecutionPlan } from './ExecutionPlan';
import { TabSection } from './TabSection/index';

interface RightPanelProps {
  currentPlan: ExecutionStep[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabs: TabItem[];
  selectedStepIndex: number | null;
  setSelectedStepIndex: (index: number | null) => void;
  getDisplayScreenshot: () => string | null;
  selectedEngine: string;
  handleStepClick: (stepIndex: number, step: ExecutionStep) => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  currentPlan,
  activeTab,
  setActiveTab,
  tabs,
  selectedStepIndex,
  setSelectedStepIndex,
  getDisplayScreenshot,
  selectedEngine,
  handleStepClick,
}) => {
  return (
    <div style={styles.rightPanel}>
      {/* Execution Plan Section */}
      <ExecutionPlan
        currentPlan={currentPlan}
        handleStepClick={handleStepClick}
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
