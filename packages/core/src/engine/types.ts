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
  VERIFY = 'verify'
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
