/**
 * Engine type definitions
 */

export interface ActionStep {
  id: string;
  type: ActionType;
  description: string;
  selector?: string;
  value?: string;
  url?: string;
  timeout?: number;
  expected?: string;
  context?: any;
  target?: {
    selector?: string;
    description?: string;
    coordinates?: { x: number; y: number };
  };
  condition?: {
    timeout?: number;
  };
  // New hierarchical properties
  subPlanId?: string;
  planReference?: {
    type: 'sub-plan' | 'action';
    id: string;
  };
  refinementLevel?: number;
}

export interface ActionPlan {
  id: string;
  objective: string;
  steps: ActionStep[];
  estimatedDuration: number;
  dependencies: string[];
  priority: number;
  metadata?: any;
  context?: any;
  // New hierarchical properties
  subPlans?: SubPlan[];
  parentPlanId?: string;
  planType?: 'global' | 'sub';
}

export interface SubPlan {
  id: string;
  parentId: string;
  objective: string;
  description: string;
  steps: ActionStep[];
  estimatedDuration: number;
  priority: number;
  dependencies: string[];
  preconditions?: string[];
  expectedOutcome?: string;
  refinementLevel: number;
  context?: any;
}

export interface HierarchicalPlan {
  id: string;
  globalObjective: string;
  globalPlan: ActionPlan;
  subPlans: SubPlan[];
  totalEstimatedDuration: number;
  planningStrategy: 'sequential' | 'parallel' | 'conditional';
  metadata?: any;
}

export enum ActionType {
  NAVIGATE = 'navigate',
  CLICK = 'click',
  TYPE = 'type',
  FILL = 'fill',
  WAIT = 'wait',
  SCREENSHOT = 'screenshot',
  SCROLL = 'scroll',
  HOVER = 'hover',
  EXTRACT = 'extract',
  VERIFY = 'verify',
  // New hierarchical action types
  EXECUTE_SUB_PLAN = 'execute_sub_plan',
  PLAN = 'plan'
}

export interface PageState {
  url: string;
  title: string;
  elements: ElementInfo[];
  timestamp: number;
  screenshot?: Buffer;
  content?: string;
  viewport?: { width: number; height: number };
}

export interface ElementInfo {
  selector: string;
  tagName: string;
  text?: string;
  attributes: Record<string, string>;
  isVisible: boolean;
  boundingBox?: BoundingBox;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TaskContext {
  id: string;
  objective: string;
  constraints: string[];
  variables: Record<string, any>;
  history: ActionStep[];
  currentState: PageState;
  url?: string;
  pageTitle?: string;
}
