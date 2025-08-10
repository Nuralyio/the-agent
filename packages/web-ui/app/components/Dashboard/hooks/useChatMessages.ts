import { useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '../Dashboard.types';
import { INITIAL_CHAT_MESSAGES } from '../utils/constants';

export const useChatMessages = () => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const addMessage = (message: ChatMessage) => {
    setChatMessages(prev => [...prev, message]);
  };

  const updateLastStepMessage = (status: string) => {
    setChatMessages(prev => {
      const newMessages = [...prev];
      const lastStepIndex = newMessages.length - 1;
      if (lastStepIndex >= 0 && newMessages[lastStepIndex].type === 'step') {
        newMessages[lastStepIndex] = {
          ...newMessages[lastStepIndex],
          status,
        };
      }
      return newMessages;
    });
  };

  return {
    chatMessages,
    setChatMessages,
    chatContainerRef,
    addMessage,
    updateLastStepMessage,
  };
};
