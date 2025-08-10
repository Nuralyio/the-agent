import React from 'react';
import { Bot20Regular, Settings20Regular, Chat20Regular } from '@fluentui/react-icons';
import type { ChatMessage, ExecutionStep } from '../../Dashboard.types';
import { styles } from '../../Dashboard.styles';
import { TabNavigation } from '../shared/TabNavigation';
import { ChatTab } from './ChatTab';
import { SettingsTab } from './SettingsTab';

interface LeftSidebarProps {
  leftPanelTab: string;
  setLeftPanelTab: (tab: string) => void;
  chatMessages: ChatMessage[];
  chatContainerRef: React.RefObject<HTMLDivElement>;
  taskDescription: string;
  setTaskDescription: (value: string) => void;
  selectedEngine: string;
  setSelectedEngine: (value: string) => void;
  advancedOpen: boolean;
  setAdvancedOpen: (value: boolean) => void;
  handleRunTask: () => void;
  copyToClipboard: (text: string) => void;
  handleStepClick: (stepIndex: number, step: ExecutionStep) => void;
}

const sidebarTabs = [
  { id: 'chat', label: 'Chat', icon: Chat20Regular },
  { id: 'settings', label: 'Settings', icon: Settings20Regular },
];

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  leftPanelTab,
  setLeftPanelTab,
  chatMessages,
  chatContainerRef,
  taskDescription,
  setTaskDescription,
  selectedEngine,
  setSelectedEngine,
  advancedOpen,
  setAdvancedOpen,
  handleRunTask,
  copyToClipboard,
  handleStepClick,
}) => {
  return (
    <div style={styles.leftSidebar}>
      {/* Sidebar Header */}
      <div style={styles.sidebarHeader}>
        <h1 style={styles.title}>
          <Bot20Regular style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Browser Automation
        </h1>
        <p style={styles.subtitle}>AI-powered web automation assistant</p>
      </div>

      {/* Tab Navigation */}
      <TabNavigation
        tabs={sidebarTabs}
        activeTab={leftPanelTab}
        onTabChange={setLeftPanelTab}
        variant="left"
      />

      {/* Tab Content */}
      {leftPanelTab === 'chat' ? (
        <ChatTab
          chatMessages={chatMessages}
          chatContainerRef={chatContainerRef}
          taskDescription={taskDescription}
          setTaskDescription={setTaskDescription}
          handleRunTask={handleRunTask}
          copyToClipboard={copyToClipboard}
          handleStepClick={handleStepClick}
        />
      ) : (
        <SettingsTab
          selectedEngine={selectedEngine}
          setSelectedEngine={setSelectedEngine}
          advancedOpen={advancedOpen}
          setAdvancedOpen={setAdvancedOpen}
        />
      )}
    </div>
  );
};
