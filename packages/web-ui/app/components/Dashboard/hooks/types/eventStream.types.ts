import type { ChatMessage, ExecutionStep, ExecutionPlan } from '../../Dashboard.types';

export interface UseEventStreamProps {
  setCurrentPlan: React.Dispatch<React.SetStateAction<ExecutionStep[]>>;
  setCurrentExecutionPlan?: React.Dispatch<React.SetStateAction<ExecutionPlan | null>>;
  setCurrentScreenshot: React.Dispatch<React.SetStateAction<string | null>>;
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  updateLastStepMessage: (status: string) => void;
  setIsLoading?: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentTaskId?: React.Dispatch<React.SetStateAction<string | null>>;
  taskId?: string | null;
}

export interface EventData {
  type: string;
  data?: any;
  task?: string;
  steps?: any[];
  stepIndex?: number;
  step?: any;
  screenshot?: string;
  error?: string;
  subPlanIndex?: number;
  subPlan?: any;
  success?: boolean;
  totalSubPlans?: number;
  globalObjective?: string;
  executionPlan?: any;
  planningStrategy?: string;
  taskId?: string;
}

export interface EventSourceHookReturn {
  connectToEventStream: () => EventSource;
}
