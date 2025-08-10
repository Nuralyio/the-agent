import React from 'react';
import type { MetaFunction } from '@remix-run/node';
import { LeftSidebar } from './components/LeftSidebar/index';
import { RightPanel } from './components/RightPanel/index';
import { useChatMessages } from './hooks/useChatMessages';
import { useEventStreamSimple } from './hooks/useEventStreamSimple';
import { useAutomationState } from './hooks/useAutomationState';
import { styles } from './Dashboard.styles';
import { DEFAULT_TABS } from './utils/constants';

export const meta: MetaFunction = () => {
  return [
    { title: 'Browser Automation Dashboard' },
    { name: 'description', content: 'Real-time browser automation visualization and control' },
  ];
};

export const Dashboard: React.FC = () => {
  const {
    chatMessages,
    setChatMessages,
    chatContainerRef,
    addMessage,
    updateLastStepMessage,
  } = useChatMessages();

  const {
    taskDescription,
    setTaskDescription,
    selectedEngine,
    setSelectedEngine,
    advancedOpen,
    setAdvancedOpen,
    activeTab,
    setActiveTab,
    leftPanelTab,
    setLeftPanelTab,
    currentPlan,
    setCurrentPlan,
    currentScreenshot,
    setCurrentScreenshot,
    selectedStepIndex,
    setSelectedStepIndex,
    handleRunTask,
    handleStepClick,
    getDisplayScreenshot,
    copyToClipboard,
  } = useAutomationState({
    chatMessages,
    setChatMessages,
    addMessage,
    updateLastStepMessage,
  });

  // Initialize event stream
  useEventStreamSimple({
    setCurrentPlan,
    setCurrentScreenshot,
    setChatMessages,
    updateLastStepMessage,
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') {
      handleRunTask();
    }
  };

  return (
    <div style={styles.container} onKeyDown={handleKeyDown} tabIndex={0}>
      <LeftSidebar
        leftPanelTab={leftPanelTab}
        setLeftPanelTab={setLeftPanelTab}
        chatMessages={chatMessages}
        chatContainerRef={chatContainerRef}
        taskDescription={taskDescription}
        setTaskDescription={setTaskDescription}
        selectedEngine={selectedEngine}
        setSelectedEngine={setSelectedEngine}
        advancedOpen={advancedOpen}
        setAdvancedOpen={setAdvancedOpen}
        handleRunTask={handleRunTask}
        copyToClipboard={copyToClipboard}
        handleStepClick={handleStepClick}
      />
      <RightPanel
        currentPlan={currentPlan}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={DEFAULT_TABS}
        selectedStepIndex={selectedStepIndex}
        setSelectedStepIndex={setSelectedStepIndex}
        getDisplayScreenshot={getDisplayScreenshot}
        selectedEngine={selectedEngine}
        handleStepClick={handleStepClick}
      />
    </div>
  );
};
