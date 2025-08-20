import { useState } from 'react';
import type { ChatMessage } from '../Dashboard.types';
import { executeAutomationTask } from '../utils/api';

export const useAutomation = (addMessage: (message: ChatMessage) => void, startEventStream: () => void) => {
  const [isLoading, setIsLoading] = useState(false);

  const runTask = async (taskDescription: string, selectedEngine: string) => {
    if (!taskDescription.trim()) return;

    setIsLoading(true);

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now(),
      type: 'user',
      text: taskDescription,
      timestamp: new Date(),
    };

    addMessage(userMessage);

    try {
      // Call the automation server
      const result = await executeAutomationTask({
        taskDescription,
        engine: selectedEngine,
        options: {
          headless: true, // Default to headless mode
        },
      });

      if (result.success) {
        // Add system response
        const systemResponse: ChatMessage = {
          id: Date.now() + 1,
          type: 'system',
          text: `Starting automation with ${selectedEngine}. Task ID: ${result.taskId}`,
          timestamp: new Date(),
        };
        addMessage(systemResponse);

        // Connect to the event stream for real-time updates
        startEventStream();
      } else {
        // Add error message
        const errorMessage: ChatMessage = {
          id: Date.now() + 1,
          type: 'system',
          text: `Error: ${result.error}`,
          timestamp: new Date(),
        };
        addMessage(errorMessage);
      }
    } catch (error) {
      // Add network error message
      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        type: 'system',
        text: `Network error: ${error instanceof Error ? error.message : 'Failed to connect to automation server'}`,
        timestamp: new Date(),
      };
      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    runTask,
    isLoading,
  };
};
