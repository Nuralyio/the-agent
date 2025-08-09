// Action and execution-related type definitions

export enum ActionType {
  NAVIGATE = 'navigate',
  CLICK = 'click',
  TYPE = 'type',
  FILL = 'fill',
  SCROLL = 'scroll',
  WAIT = 'wait',
  EXTRACT = 'extract',
  VERIFY = 'verify',
  SCREENSHOT = 'screenshot'
}

export enum ScrollDirection {
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right'
}

export interface ActionStep {
  type: ActionType;
  description: string;
  target?: ElementTarget;
  value?: string;
  timeout?: number;
  scroll?: {
    direction: ScrollDirection;
    distance?: number;
  };
  screenshot?: boolean;
}

export interface ElementTarget {
  selector?: string;
  text?: string;
  coordinates?: { x: number; y: number };
  description: string;
}

export interface ElementMetadata {
  tag: string;
  text: string;
  attributes: Record<string, string>;
  boundingBox: { x: number; y: number; width: number; height: number };
  isVisible: boolean;
  isClickable: boolean;
}

export interface ActionableElement {
  element: ElementHandle;
  confidence: number;
  reason: string;
  metadata: ElementMetadata;
}

export interface ExecutionOptions {
  timeout?: number;
  waitForNavigation?: boolean;
  screenshotOnError?: boolean;
  retryOnFailure?: boolean;
  maxRetries?: number;
}

export interface TaskResult {
  success: boolean;
  message: string;
  steps?: ActionStep[];
  screenshots?: string[]; // Base64 encoded
  errors?: string[];
  metadata?: {
    duration: number;
    browserUsed: string;
    totalSteps: number;
    successfulSteps: number;
  };
}

export interface PlanningResult {
  steps: ActionStep[];
  reasoning: string;
  confidence: number;
  estimated_duration?: number;
}

// Page and element interfaces
export interface PageInstance {
  url(): Promise<string>;
  title(): Promise<string>;
  content(): Promise<string>;
  screenshot(options?: any): Promise<Buffer>;
  navigate(url: string): Promise<void>;
  click(selector: string): Promise<void>;
  type(selector: string, text: string): Promise<void>;
  fill(selector: string, text: string): Promise<void>;
  waitForSelector(selector: string, options?: any): Promise<ElementHandle>;
  findElement(selector: string): Promise<ElementHandle | null>;
  findElements(selector: string): Promise<ElementHandle[]>;
  evaluate(fn: Function, ...args: any[]): Promise<any>;
  close(): Promise<void>;
}

export interface ElementHandle {
  click(): Promise<void>;
  type(text: string): Promise<void>;
  fill(text: string): Promise<void>;
  getAttribute(name: string): Promise<string | null>;
  getText(): Promise<string>;
  isVisible(): Promise<boolean>;
  isEnabled(): Promise<boolean>;
  getProperty(name: string): Promise<any>;
  boundingBox(): Promise<{ x: number; y: number; width: number; height: number } | null>;
}
