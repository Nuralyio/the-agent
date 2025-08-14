export interface ChatMessage {
  id: number;
  type: 'user' | 'system' | 'step' | 'plan' | 'hierarchical_plan';
  text: string;
  timestamp: Date;
  description?: string;
  status?: string;
  steps?: ExecutionStep[];
  hierarchicalPlan?: HierarchicalPlan;
}

export interface ExecutionStep {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  timestamp?: Date;
  screenshot?: string;
  subPlanId?: string;
  stepIndex?: number;
  // Action details
  actionType?: string;
  target?: {
    selector?: string;
    description?: string;
    coordinates?: { x: number; y: number };
  };
  value?: string;
}

export interface SubPlan {
  id: string;
  objective: string;
  description: string;
  steps: ExecutionStep[];
  estimatedDuration: number;
  priority: number;
  status: 'pending' | 'running' | 'completed' | 'error';
  dependencies: string[];
  preconditions?: string[];
  expectedOutcome?: string;
  context?: any;
}

export interface HierarchicalPlan {
  id: string;
  globalObjective: string;
  subPlans: SubPlan[];
  totalEstimatedDuration: number;
  planningStrategy: 'sequential' | 'parallel' | 'conditional';
  currentSubPlanIndex?: number;
  status?: 'pending' | 'running' | 'completed' | 'error';
  metadata?: any;
}

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ComponentType<any>;
}

export interface AutomationSettings {
  engine: string;
  timeout: number;
  browserMode: 'headless' | 'headed';
  viewportSize: string;
  userAgent: string;
}
