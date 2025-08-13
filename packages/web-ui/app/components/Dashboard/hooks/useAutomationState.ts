import { useState, useEffect } from 'react';
import type { ChatMessage, ExecutionStep, HierarchicalPlan } from '../Dashboard.types';
import { executeAutomationTask } from '../utils/api';

interface UseAutomationProps {
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  addMessage: (message: ChatMessage) => void;
  updateLastStepMessage: (status: string) => void;
}

export const useAutomationState = ({
  chatMessages,
  setChatMessages,
  addMessage,
  updateLastStepMessage,
}: UseAutomationProps) => {
  const [taskDescription, setTaskDescription] = useState('');
  const [selectedEngine, setSelectedEngine] = useState('playwright');
  const [selectedAIProvider, setSelectedAIProvider] = useState('openai');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');
  const [leftPanelTab, setLeftPanelTab] = useState('chat');
  const [currentStep, setCurrentStep] = useState(0);
  const [currentPlan, setCurrentPlan] = useState<ExecutionStep[]>([]);
  const [currentHierarchicalPlan, setCurrentHierarchicalPlan] = useState<HierarchicalPlan | null>(null);
  const [currentScreenshot, setCurrentScreenshot] = useState<string | null>(null);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [headlessMode, setHeadlessMode] = useState(false); // Default to headed mode for better UX

  // Effect to sync currentPlan and currentHierarchicalPlan from chatMessages
  useEffect(() => {
    // Find the latest plan or hierarchical plan in chat messages
    const latestPlanMessage = [...chatMessages]
      .reverse()
      .find(msg => msg.type === 'plan' || msg.type === 'hierarchical_plan');

    if (latestPlanMessage) {
      if (latestPlanMessage.type === 'hierarchical_plan' && latestPlanMessage.hierarchicalPlan) {
        // Set hierarchical plan if it's not already set
        if (!currentHierarchicalPlan) {
          setCurrentHierarchicalPlan(latestPlanMessage.hierarchicalPlan);
        }
        
        // Set current plan to sub-plan overview if currentPlan is empty
        if (currentPlan.length === 0) {
          const subPlanSteps: ExecutionStep[] = latestPlanMessage.hierarchicalPlan.subPlans.map((subPlan, index) => ({
            id: index,
            title: `Sub-plan ${index + 1}: ${subPlan.objective}`,
            description: `${subPlan.steps.length} steps • Priority: ${subPlan.priority} • Est: ${Math.round(subPlan.estimatedDuration / 1000)}s`,
            status: subPlan.status,
            timestamp: new Date()
          }));
          setCurrentPlan(subPlanSteps);
        }
      } else if (latestPlanMessage.type === 'plan' && latestPlanMessage.steps) {
        // Set regular plan if currentPlan is empty
        if (currentPlan.length === 0) {
          setCurrentPlan(latestPlanMessage.steps);
        }
      }
    }
  }, [chatMessages, currentPlan.length, currentHierarchicalPlan]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  const handleStepClick = (stepIndex: number, step: ExecutionStep) => {
    setSelectedStepIndex(stepIndex);
    if (step.screenshot) {
      setCurrentScreenshot(step.screenshot);
    }
  };

  const getDisplayScreenshot = () => {
    if (selectedStepIndex !== null && currentPlan[selectedStepIndex]?.screenshot) {
      return currentPlan[selectedStepIndex].screenshot;
    }
    return currentScreenshot;
  };

  const handleRunTask = async () => {
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
        aiProvider: selectedAIProvider,
        options: {
          headless: headlessMode,
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

    setTaskDescription('');
  };

  return {
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
    currentStep,
    setCurrentStep,
    currentPlan,
    setCurrentPlan,
    currentHierarchicalPlan,
    setCurrentHierarchicalPlan,
    currentScreenshot,
    setCurrentScreenshot,
    selectedStepIndex,
    setSelectedStepIndex,
    isLoading,
    headlessMode,
    setHeadlessMode,
    handleRunTask,
    handleStepClick,
    getDisplayScreenshot,
    copyToClipboard,
  };
};
