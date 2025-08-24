import { StepExecutionResult } from '../../../engine/analysis/step-context';
import { ActionStep } from '../../../engine/planning/types/types';

/**
 * Execution log entry for JSON format
 */
export interface ExecutionLogEntry {
  timestamp: string;
  sessionId: string;
  stepIndex: number;
  step: {
    type: string;
    description: string;
    target?: {
      selector?: string;
      description?: string;
    };
    value?: string;
  };
  result: {
    success: boolean;
    error?: string;
    elementFound?: boolean;
    selectorUsed?: string;
    valueEntered?: string;
    executionTimeMs: number;
  };
  page: {
    url: string;
    title: string;
    viewport?: {
      width: number;
      height: number;
    };
  };
  screenshot?: {
    filename: string;
    path: string;
  };
  context?: {
    previousStepsCount: number;
    sessionDuration: number;
  };
  refinement?: {
    wasRefined: boolean;
    originalStep?: {
      description: string;
      selector?: string;
      value?: string;
    };
    refinedStep?: {
      description: string;
      selector?: string;
      value?: string;
    };
    refinementReason?: string;
    contextUsed?: {
      previousStepPatterns?: string[];
      pageContentAnalysis?: string;
    };
  };
  iteration?: {
    stepIteration: number;
    totalIterations: number;
    planAdapted: boolean;
    adaptationReason?: string;
  };
}

/**
 * Complete execution session log
 */
export interface ExecutionSessionLog {
  sessionId: string;
  startTime: string;
  endTime?: string;
  instruction: string;
  totalSteps: number;
  successfulSteps: number;
  failedSteps: number;
  totalDuration: number;
  success: boolean;
  entries: ExecutionLogEntry[];
  summary: {
    stepTypes: Record<string, number>;
    errorTypes: Record<string, number>;
    averageStepTime: number;
    successRate: number;
  };
}

/**
 * Step logging configuration
 */
export interface StepLogConfig {
  stepIndex: number;
  step: ActionStep;
  result: StepExecutionResult;
  pageUrl: string;
  pageTitle: string;
  screenshotBuffer?: Buffer;
  viewport?: { width: number; height: number };
  refinementInfo?: RefinementInfo;
  iterationInfo?: IterationInfo;
}

/**
 * Refinement information for step logging
 */
export interface RefinementInfo {
  wasRefined: boolean;
  originalStep?: ActionStep;
  refinementReason?: string;
  contextUsed?: {
    previousStepPatterns?: string[];
    pageContentAnalysis?: string;
  };
}

/**
 * Iteration information for step logging
 */
export interface IterationInfo {
  stepIteration: number;
  totalIterations: number;
  planAdapted: boolean;
  adaptationReason?: string;
}

/**
 * Screenshot save configuration
 */
export interface ScreenshotConfig {
  sessionId: string;
  stepIndex: number;
  success: boolean;
  buffer: Buffer;
  screenshotDir: string;
}

/**
 * File management configuration
 */
export interface FileConfig {
  logDir: string;
  screenshotDir: string;
  sessionId: string;
}

/**
 * Logging statistics
 */
export interface LoggingStats {
  stepTypes: Record<string, number>;
  errorTypes: Record<string, number>;
  totalExecutionTime: number;
  stepCount: number;
}
