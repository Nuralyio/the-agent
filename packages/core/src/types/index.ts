// Core Type Definitions for Browser Automation Framework

// Browser Types
export enum BrowserType {
  CHROMIUM = 'chromium',
  FIREFOX = 'firefox',
  WEBKIT = 'webkit',
  CHROME = 'chrome',
  EDGE = 'edge'
}

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

// Configuration Types
export interface LaunchOptions {
  headless?: boolean;
  viewport?: { width: number; height: number };
  userAgent?: string;
  locale?: string;
  timezone?: string;
  proxy?: ProxyConfig;
  args?: string[];
  executablePath?: string;
}

export interface ProxyConfig {
  server: string;
  username?: string;
  password?: string;
  bypass?: string[];
}

export interface BrowserConfig {
  adapter: string;
  browserType: BrowserType;
  headless: boolean;
  viewport: { width: number; height: number };
  userAgent?: string;
  locale?: string;
  timezone?: string;
  proxy?: ProxyConfig;
  extensions?: string[];
  fallbackAdapters?: string[];
}

export interface BrowserRequirements {
  browserType: BrowserType;
  features: string[];
  crossBrowser: boolean;
  performance: 'fast' | 'balanced' | 'robust';
}

export interface AIConfig {
  provider: 'ollama';
  model: string;
  apiKey?: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
}

// Element Types
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

export interface ElementAnalysis {
  elements: ActionableElement[];
  screenshots: Buffer[];
  accessibility: any;
  timestamp: Date;
}

// Action Types
export interface ActionStep {
  type: ActionType;
  target?: ElementTarget;
  value?: string;
  condition?: WaitCondition;
  description: string;
}

export interface ActionPlan {
  steps: ActionStep[];
  context: TaskContext;
  expectedOutcome: string;
}

export interface ExecutedStep {
  step: ActionStep;
  result: ActionResult;
  timestamp: Date;
  screenshot?: Buffer;
}

export interface TaskResult {
  success: boolean;
  steps: ExecutedStep[];
  extractedData?: any;
  error?: string;
  screenshots?: Buffer[];
}

export interface ActionResult {
  success: boolean;
  error?: string;
  data?: any;
  screenshot?: Buffer;
  timestamp: Date;
}

export interface TaskContext {
  url: string;
  pageTitle: string;
  currentStep: number;
  totalSteps: number;
  variables: Record<string, any>;
  extractedData?: any;
}

// Wait Conditions
export interface WaitCondition {
  type: 'selector' | 'url' | 'text' | 'function' | 'timeout';
  value: string | number | (() => boolean);
  timeout?: number;
}

export interface WaitOptions {
  timeout?: number;
  visible?: boolean;
  hidden?: boolean;
  state?: 'attached' | 'detached' | 'visible' | 'hidden';
}

// Screenshot Options
export interface ScreenshotOptions {
  path?: string;
  type?: 'png' | 'jpeg';
  quality?: number;
  fullPage?: boolean;
  clip?: { x: number; y: number; width: number; height: number };
  omitBackground?: boolean;
}

// Execution Options
export interface ExecutionOptions {
  timeout?: number;
  retries?: number;
  screenshotOnError?: boolean;
  continueOnError?: boolean;
  variables?: Record<string, any>;
}

// Browser Adapter Interfaces
export interface ElementHandle {
  click(): Promise<void>;
  type(text: string): Promise<void>;
  getText(): Promise<string>;
  getAttribute(name: string): Promise<string | null>;
  isVisible(): Promise<boolean>;
  boundingBox(): Promise<{ x: number; y: number; width: number; height: number } | null>;
}

export interface PageInstance {
  navigate(url: string): Promise<void>;
  click(selector: string): Promise<void>;
  type(selector: string, text: string): Promise<void>;
  screenshot(options?: ScreenshotOptions): Promise<Buffer>;
  content(): Promise<string>;
  evaluate<T>(fn: () => T): Promise<T>;
  waitForSelector(selector: string, options?: WaitOptions): Promise<ElementHandle>;
  waitForLoad(): Promise<void>;
  close(): Promise<void>;
}

export interface BrowserInstance {
  createPage(url?: string): Promise<PageInstance>;
  close(): Promise<void>;
  version(): string;
  isConnected(): boolean;
}

export interface BrowserAdapter {
  name: string;
  version: string;
  launch(options: LaunchOptions): Promise<BrowserInstance>;
  getSupportedBrowsers(): BrowserType[];
  getDefaultOptions(): LaunchOptions;
}

// Core Framework Interfaces
export interface BrowserManager {
  setAdapter(adapter: BrowserAdapter): void;
  launchBrowser(options?: LaunchOptions): Promise<BrowserInstance>;
  createPage(url?: string): Promise<PageInstance>;
  getCurrentPage(): Promise<PageInstance | null>;
  closeBrowser(): Promise<void>;
  takeScreenshot(options?: ScreenshotOptions): Promise<Buffer>;
  getPageContent(): Promise<string>;
  switchBrowser(browserType: BrowserType): Promise<void>;
}

export interface ElementDetector {
  findElements(selector: ElementSelector): Promise<ElementHandle[]>;
  analyzeElements(screenshot: Buffer, html: string): Promise<ElementAnalysis>;
  identifyActionableElements(): Promise<ActionableElement[]>;
  getElementMetadata(element: ElementHandle): Promise<ElementMetadata>;
}

export interface ActionExecutor {
  click(target: ElementTarget): Promise<ActionResult>;
  type(target: ElementTarget, text: string): Promise<ActionResult>;
  scroll(direction: ScrollDirection, amount?: number): Promise<ActionResult>;
  navigate(url: string): Promise<ActionResult>;
  wait(condition: WaitCondition): Promise<ActionResult>;
}

export interface ActionEngine {
  executeTask(instruction: string, options?: ExecutionOptions): Promise<TaskResult>;
  parseInstruction(instruction: string): Promise<ActionPlan>;
  executeActionPlan(plan: ActionPlan): Promise<TaskResult>;
  captureState(): Promise<PageState>;
}

// Selector Types
export interface ElementSelector {
  css?: string;
  xpath?: string;
  text?: string;
  role?: string;
  testId?: string;
}

// State Types
export interface PageState {
  url: string;
  title: string;
  content: string;
  screenshot: Buffer;
  timestamp: Date;
  viewport: { width: number; height: number };
}

// Error Types
export interface ActionError {
  type: 'ELEMENT_NOT_FOUND' | 'TIMEOUT' | 'NAVIGATION_FAILED' | 'EXECUTION_ERROR';
  message: string;
  step?: ActionStep;
  screenshot?: Buffer;
  timestamp: Date;
}

export interface RecoveryAction {
  type: 'RETRY' | 'SKIP' | 'ALTERNATIVE' | 'ABORT';
  description: string;
  data?: any;
}

export interface ExecutionContext {
  adapter: BrowserAdapter;
  page: PageInstance;
  currentStep: ActionStep;
  variables: Record<string, any>;
}

// Plugin Types
export interface Plugin {
  name: string;
  version: string;
  supportedAdapters?: string[];
  install(framework: any): Promise<void>;
  uninstall(): Promise<void>;
}

export interface BrowserAdapterPlugin {
  name: string;
  version: string;
  supportedAdapters: string[];
  install(adapter: BrowserAdapter): Promise<void>;
  uninstall(): Promise<void>;
}

// Task and Report Types
export interface TaskReport {
  taskId: string;
  instruction: string;
  result: TaskResult;
  performance: PerformanceMetrics;
  screenshots: Buffer[];
  logs: LogEntry[];
  timestamp: Date;
}

export interface PerformanceMetrics {
  executionTime: number;
  stepCount: number;
  errorCount: number;
  screenshotCount: number;
  memoryUsage: number;
}

export interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: Date;
  data?: any;
}
