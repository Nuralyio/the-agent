import type { ChatMessage, ExecutionStep, HierarchicalPlan } from '../../Dashboard.types';

export interface UseEventStreamProps {
  setCurrentPlan: React.Dispatch<React.SetStateAction<ExecutionStep[]>>;
  setCurrentHierarchicalPlan?: React.Dispatch<React.SetStateAction<HierarchicalPlan | null>>;
  setCurrentScreenshot: React.Dispatch<React.SetStateAction<string | null>>;
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  updateLastStepMessage: (status: string) => void;
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
  hierarchicalPlan?: any;
  planningStrategy?: string;
}

export interface EventSourceHookReturn {
  connectToEventStream: () => EventSource;
}
