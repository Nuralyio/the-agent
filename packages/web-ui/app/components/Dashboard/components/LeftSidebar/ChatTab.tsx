import React from 'react';
import type { ChatMessage, ExecutionStep } from '../../Dashboard.types';
import { styles } from '../../Dashboard.styles';
import { copyToClipboard, formatTime } from '../../utils/formatting';
import { MessageBubble } from './components/MessageBubble';
import { PlanBubble } from './components/PlanBubble';
import { StepBubble } from './components/StepBubble';
import { HierarchicalPlanBubble } from './components/HierarchicalPlanBubble';
import { ChatInput } from './components/ChatInput';

interface ChatTabProps {
  chatMessages: ChatMessage[];
  chatContainerRef: React.RefObject<HTMLDivElement>;
  taskDescription: string;
  setTaskDescription: (value: string) => void;
  handleRunTask: () => void;
  copyToClipboard: (text: string) => void;
  handleStepClick: (stepIndex: number, step: ExecutionStep) => void;
}

export const ChatTab: React.FC<ChatTabProps> = ({
  chatMessages,
  chatContainerRef,
  taskDescription,
  setTaskDescription,
  handleRunTask,
  copyToClipboard,
  handleStepClick,
}) => {
  return (
    <>
      {/* Chat Messages */}
      <div ref={chatContainerRef} style={styles.chatContainer}>
        {chatMessages.map(message => (
          <div key={message.id}>
            {message.type === 'step' ? (
              <StepBubble
                message={message}
              />
            ) : message.type === 'plan' ? (
              <PlanBubble
                message={message}
                selectedStepIndex={null}
                onStepClick={handleStepClick}
              />
            ) : message.type === 'hierarchical_plan' ? (
              <HierarchicalPlanBubble
                message={message}
                selectedStepIndex={null}
                onStepClick={handleStepClick}
              />
            ) : (
              <MessageBubble
                message={message}
                onCopy={copyToClipboard}
                formatTime={formatTime}
              />
            )}
          </div>
        ))}
      </div>

      {/* Chat Input */}
      <ChatInput
        taskDescription={taskDescription}
        setTaskDescription={setTaskDescription}
        onRunTask={handleRunTask}
        isLoading={false}
      />
    </>
  );
};
