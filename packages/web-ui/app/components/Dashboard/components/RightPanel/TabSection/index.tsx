import React from 'react';
import type { ExecutionStep, TabItem } from '../../../Dashboard.types';
import { styles } from '../../../Dashboard.styles';
import { TabNavigation } from '../../shared/TabNavigation';
import { PreviewTab } from './PreviewTab';
import { LogsTab } from './LogsTab';

interface TabSectionProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabs: TabItem[];
  selectedStepIndex: number | null;
  setSelectedStepIndex: (index: number | null) => void;
  getDisplayScreenshot: () => string | null;
  selectedEngine: string;
  currentPlan: ExecutionStep[];
}

export const TabSection: React.FC<TabSectionProps> = ({
  activeTab,
  setActiveTab,
  tabs,
  selectedStepIndex,
  setSelectedStepIndex,
  getDisplayScreenshot,
  selectedEngine,
  currentPlan,
}) => {
  return (
    <div style={styles.rightTabSection}>
      {/* Tab Navigation */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="right"
      />

      {/* Tab Content */}
      <div style={styles.rightTabContent}>
        {activeTab === 'preview' && (
          <PreviewTab
            selectedStepIndex={selectedStepIndex}
            setSelectedStepIndex={setSelectedStepIndex}
            getDisplayScreenshot={getDisplayScreenshot}
            currentPlan={currentPlan}
          />
        )}

        {activeTab === 'logs' && (
          <LogsTab />
        )}
      </div>
    </div>
  );
};
