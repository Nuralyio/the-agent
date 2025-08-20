import type { MetaFunction } from '@remix-run/node';
import React from 'react';
import { LeftSidebar } from './components/LeftSidebar/index';
import RightPanel from './components/RightPanel/index';
import { styles } from './Dashboard.styles';
import { useAutomationState } from './hooks/useAutomationState';
import { useChatMessages } from './hooks/useChatMessages';
import { useEventStreamSimple } from './hooks/useEventStreamSimple';
import { DEFAULT_TABS } from './utils/constants';

export const meta: MetaFunction = () => [
  { title: 'The Agent Dashboard' },
  { name: 'description', content: 'Real-time AI agent monitor and control' },
];

export const Dashboard: React.FC = () => {
  // Generate a simple session ID for video streaming
  const sessionId = React.useMemo(() => `session_${Date.now()}`, []);

  const { chatMessages, setChatMessages, chatContainerRef, addMessage, updateLastStepMessage } = useChatMessages();

  const {
    taskDescription,
    setTaskDescription,
    selectedEngine,
    setSelectedEngine,
    selectedAIProvider,
    setSelectedAIProvider,
    advancedOpen,
    setAdvancedOpen,
    activeTab,
    setActiveTab,
    leftPanelTab,
    setLeftPanelTab,
    currentPlan,
    setCurrentPlan,
    currentExecutionPlan,
    setCurrentExecutionPlan,
    currentScreenshot,
    setCurrentScreenshot,
    selectedStepIndex,
    setSelectedStepIndex,
    isLoading,
    setIsLoading,
    headlessMode,
    setHeadlessMode,
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
    setCurrentExecutionPlan,
    setCurrentScreenshot,
    setChatMessages,
    updateLastStepMessage,
    setIsLoading,
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
        selectedAIProvider={selectedAIProvider}
        setSelectedAIProvider={setSelectedAIProvider}
        advancedOpen={advancedOpen}
        setAdvancedOpen={setAdvancedOpen}
        headlessMode={headlessMode}
        setHeadlessMode={setHeadlessMode}
        handleRunTask={handleRunTask}
        copyToClipboard={copyToClipboard}
        handleStepClick={handleStepClick}
      />
      <RightPanel
        currentPlan={currentPlan}
        currentExecutionPlan={currentExecutionPlan}
        isLoading={isLoading}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={DEFAULT_TABS}
        selectedStepIndex={selectedStepIndex}
        setSelectedStepIndex={setSelectedStepIndex}
        getDisplayScreenshot={getDisplayScreenshot}
        selectedEngine={selectedEngine}
        handleStepClick={handleStepClick}
        sessionId={sessionId}
      />
    </div>
  );
};
