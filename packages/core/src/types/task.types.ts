/**
 * Task execution and result type definitions
 */

import type { ActionStep, TaskContext } from '../engine/planning/types/types';

export type TaskResult = {
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
  screenshots?: Buffer[];
  steps: ActionStep[];
  extractedData?: any;
  plan?: any; // Allow plan data to be included
  instruction?: string; // Store the original instruction
  executionPlanExport?: any; // Store export data for immediate access
};

export interface ActionEngine {
  executeTask(objective: string, context?: TaskContext): Promise<TaskResult>;
}
