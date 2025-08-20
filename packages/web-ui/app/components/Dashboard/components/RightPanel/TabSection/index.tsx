import React from 'react';
import type { ExecutionStep, TabItem } from '../../../Dashboard.types';
import { styles } from '../../../Dashboard.styles';
import { TabNavigation } from '../../shared/TabNavigation';
import { PreviewTab } from './PreviewTab';
import { LogsTab } from './LogsTab';
import { LiveVideoStream } from './LiveVideoStream';

interface TabSectionProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabs: TabItem[];
  selectedStepIndex: number | null;
  setSelectedStepIndex: (index: number | null) => void;
  getDisplayScreenshot: () => string | null;
  selectedEngine: string;
  currentPlan: ExecutionStep[];
  sessionId?: string;
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
  sessionId,
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

        {activeTab === 'video' && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#ffffff' }}>
              Live Browser Video Stream
            </h2>
            <LiveVideoStream
              isVisible={activeTab === 'video'}
              sessionId={sessionId}
              style={{ width: '100%' }}
            />
          </div>
        )}

        {activeTab === 'logs' && (
          <LogsTab />
        )}
      </div>
    </div>
  );
};
