import React from 'react';
import { styles } from '../../../Dashboard.styles';
import type { ExecutionStep, TabItem } from '../../../Dashboard.types';
import { TabNavigation } from '../../shared/TabNavigation';
import { ExportTab } from './ExportTab';
import { LiveVideoStream } from './LiveVideoStream';
import { LogsTab } from './LogsTab';
import { PreviewTab } from './PreviewTab';

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
  isLoading?: boolean;
  currentTaskId?: string;
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
  isLoading = false,
  currentTaskId,
}) => {
  return (
    <div style={styles.rightTabSection}>
      <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} variant='right' />
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
            <LiveVideoStream isVisible={activeTab === 'video'} sessionId={sessionId} style={{ width: '100%' }} />
          </div>
        )}

        {activeTab === 'logs' && <LogsTab />}

        {activeTab === 'export' && <ExportTab isTaskRunning={isLoading} currentTaskId={currentTaskId} />}
      </div>
    </div>
  );
};
