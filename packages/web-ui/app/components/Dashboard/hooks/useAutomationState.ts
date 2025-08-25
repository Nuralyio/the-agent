import { useEffect, useState } from 'react';
import type { ChatMessage, ExecutionPlan, ExecutionStep } from '../Dashboard.types';
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
  const [currentExecutionPlan, setCurrentExecutionPlan] = useState<ExecutionPlan | null>(null);
  const [currentScreenshot, setCurrentScreenshot] = useState<string | null>(null);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [headlessMode, setHeadlessMode] = useState(true); // Default to headless mode
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

  useEffect(() => {
    const latestPlanMessage = [...chatMessages]
      .reverse()
      .find(msg => msg.type === 'plan' || msg.type === 'execution_plan');

    if (latestPlanMessage) {
      if (latestPlanMessage.type === 'execution_plan' && latestPlanMessage.executionPlan) {
        if (!currentExecutionPlan) {
          setCurrentExecutionPlan(latestPlanMessage.executionPlan);
        }
        if (currentPlan.length === 0) {
          const subPlanSteps: ExecutionStep[] = latestPlanMessage.executionPlan.subPlans.map((subPlan, index) => ({
            id: index,
            title: `Sub-plan ${index + 1}: ${subPlan.objective}`,
            description: `${subPlan.steps.length} steps • Priority: ${subPlan.priority} • Est: ${Math.round(subPlan.estimatedDuration / 1000)}s`,
            status: subPlan.status,
            timestamp: new Date()
          }));
          setCurrentPlan(subPlanSteps);
        }
      } else if (latestPlanMessage.type === 'plan' && latestPlanMessage.steps) {
        if (currentPlan.length === 0) {
          setCurrentPlan(latestPlanMessage.steps);
        }
      }
    }
  }, [chatMessages, currentPlan.length, currentExecutionPlan]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
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

    setCurrentPlan([]);
    setCurrentExecutionPlan(null);

    const userMessage: ChatMessage = {
      id: Date.now(),
      type: 'user',
      text: taskDescription,
      timestamp: new Date(),
    };

    addMessage(userMessage);

    try {
      const result = await executeAutomationTask({
        taskDescription,
        engine: selectedEngine,
        aiProvider: selectedAIProvider,
        options: {
          headless: headlessMode,
        },
      });

      if (result.success) {
        // Store the task ID
        setCurrentTaskId(result.taskId || null);
        
        const systemResponse: ChatMessage = {
          id: Date.now() + 1,
          type: 'system',
          text: `Starting automation with ${selectedEngine}. Task ID: ${result.taskId}`,
          timestamp: new Date(),
        };
        addMessage(systemResponse);
      } else {
        const errorMessage: ChatMessage = {
          id: Date.now() + 1,
          type: 'system',
          text: `Error: ${result.error}`,
          timestamp: new Date(),
        };
        addMessage(errorMessage);
        setIsLoading(false);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        type: 'system',
        text: `Network error: ${error instanceof Error ? error.message : 'Failed to connect to automation server'}`,
        timestamp: new Date(),
      };
      addMessage(errorMessage);
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
    currentTaskId,
    setCurrentTaskId,
    handleRunTask,
    handleStepClick,
    getDisplayScreenshot,
    copyToClipboard,
  };
};
