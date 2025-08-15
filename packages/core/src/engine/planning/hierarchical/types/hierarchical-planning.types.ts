import { PageState, SubPlan, TaskContext } from '../../../types';

/**
 * Global plan instruction structure from AI response
 */
export interface GlobalPlanInstruction {
  subObjectives: string[];
  planningStrategy: 'sequential' | 'parallel' | 'conditional';
  reasoning: string;
}

/**
 * Global plan creation configuration
 */
export interface GlobalPlanConfig {
  instruction: string;
  context: TaskContext;
  pageState?: PageState;
  minSubObjectives?: number;
  maxSubObjectives?: number;
}

/**
 * Sub-plan creation configuration
 */
export interface SubPlanConfig {
  subObjective: string;
  originalInstruction: string;
  context: TaskContext;
  pageState?: PageState;
  subPlanIndex: number;
  totalSubPlans: number;
}

/**
 * Plan execution result
 */
export interface PlanExecutionResult {
  success: boolean;
  results: any[];
  plan: any;
  executionTime?: number;
  failedAt?: number;
}

/**
 * Plan assembly configuration
 */
export interface PlanAssemblyConfig {
  instruction: string;
  context: TaskContext;
  subPlans: SubPlan[];
  strategy: 'sequential' | 'parallel' | 'conditional';
}

/**
 * Execution context for hierarchical plans
 */
export interface HierarchicalExecutionContext {
  currentSubPlanIndex: number;
  totalSubPlans: number;
  strategy: string;
  startTime: number;
  results: any[];
}
