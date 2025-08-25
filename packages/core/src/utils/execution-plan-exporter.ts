/**
 * Execution plan export utilities
 * Provides functionality to export execution plans with subplans and actions
 */

import type { ActionStep, Plan, SubPlan } from '../engine/planning/types/types';
import type { TaskResult } from '../types/task.types';

export interface ExecutionPlanExport {
  id: string;
  timestamp: string;
  globalObjective: string;
  totalDuration: number;
  totalSteps: number;
  success: boolean;
  planningStrategy: string;
  subPlans: SubPlanExport[];
  summary: ExecutionSummary;
  metadata: ExportMetadata;
}

export interface SubPlanExport {
  id: string;
  objective: string;
  description: string;
  priority: number;
  estimatedDuration: number;
  actualDuration?: number;
  status: 'completed' | 'failed' | 'partial';
  steps: ActionStepExport[];
  dependencies: string[];
  preconditions?: string[];
  expectedOutcome?: string;
  actualOutcome?: string;
}

export interface ActionStepExport {
  id: string;
  type: string;
  description: string;
  target?: {
    selector?: string;
    description?: string;
    coordinates?: { x: number; y: number };
  };
  value?: any;
  url?: string;
  timeout?: number;
  expected?: string;
  executionTime?: number;
  success?: boolean;
  error?: string;
  screenshot?: string;
  extractedData?: any;
  subPlanId?: string;
  planReference?: {
    type: 'sub-plan' | 'action';
    id: string;
  };
  refinementLevel?: number;
}

export interface ExecutionSummary {
  totalSubPlans: number;
  completedSubPlans: number;
  failedSubPlans: number;
  totalActions: number;
  successfulActions: number;
  failedActions: number;
  successRate: number;
  averageStepDuration: number;
}

export interface ExportMetadata {
  exportedAt: string;
  exportFormat: 'json';
  agentVersion: string;
  browserAdapter: string;
  aiProvider?: string;
  aiModel?: string;
}

export interface ExportOptions {
  includeScreenshots?: boolean;
  includeSensitiveData?: boolean;
  prettify?: boolean;
  filePath?: string;
}

/**
 * Execution plan exporter
 */
export class ExecutionPlanExporter {

  /**
   * Export execution plan from TaskResult
   */
  static exportFromTaskResult(
    taskResult: TaskResult,
    originalInstruction: string,
    options: ExportOptions = {}
  ): ExecutionPlanExport {
    const plan = taskResult.plan as Plan;
    if (!plan) {
      throw new Error('No execution plan found in task result');
    }

    return this.exportFromPlan(plan, taskResult, originalInstruction, options);
  }

  /**
   * Export execution plan from Plan object
   */
  static exportFromPlan(
    plan: Plan,
    taskResult?: TaskResult,
    originalInstruction?: string,
    options: ExportOptions = {}
  ): ExecutionPlanExport {
    const timestamp = new Date().toISOString();
    const globalObjective = originalInstruction || plan.globalObjective;

    let distributedSteps: ActionStep[][] = [];
    if (taskResult?.steps && taskResult.steps.length > 0) {
      const executedSteps = taskResult.steps;
      const numSubPlans = plan.subPlans.length;

      const hasSubPlanMapping = executedSteps.some(step => step.subPlanId);

      if (!hasSubPlanMapping && numSubPlans > 0) {
        const stepsPerSubPlan = Math.ceil(executedSteps.length / numSubPlans);
        for (let i = 0; i < numSubPlans; i++) {
          const start = i * stepsPerSubPlan;
          const end = Math.min(start + stepsPerSubPlan, executedSteps.length);
          distributedSteps[i] = executedSteps.slice(start, end);
        }
      }
    }

    const subPlansExport = plan.subPlans.map((subPlan, index) =>
      this.exportSubPlan(subPlan, taskResult?.steps, options, distributedSteps[index])
    );

    const totalStepsFromTaskResult = taskResult?.steps?.length || 0;
    const totalStepsFromSubPlans = subPlansExport.reduce((sum, sp) => sum + sp.steps.length, 0);
    const totalSteps = totalStepsFromTaskResult > 0 ? totalStepsFromTaskResult : totalStepsFromSubPlans;

    const summary = this.calculateExecutionSummary(subPlansExport, taskResult);

    let overallSuccess = taskResult?.success || false;
    if (!overallSuccess && subPlansExport.length > 0) {
      overallSuccess = subPlansExport.every(sp => sp.status === 'completed');
    }

    const exportData: ExecutionPlanExport = {
      id: plan.id,
      timestamp,
      globalObjective,
      totalDuration: taskResult?.duration || plan.totalEstimatedDuration,
      totalSteps,
      success: overallSuccess,
      planningStrategy: plan.planningStrategy,
      subPlans: subPlansExport,
      summary,
      metadata: {
        exportedAt: timestamp,
        exportFormat: 'json',
        agentVersion: '1.0.0',
        browserAdapter: 'unknown', // need to be passed from context
        aiProvider: 'unknown', // need to be passed from context
        aiModel: 'unknown' // need to be passed from context
      }
    };

    return exportData;
  }

  /**
   * Export a single sub-plan
   */
  private static exportSubPlan(
    subPlan: SubPlan,
    executedSteps?: ActionStep[],
    options: ExportOptions = {},
    distributedSteps?: ActionStep[]
  ): SubPlanExport {
    const plannedSteps = subPlan.steps;
    let stepsToExport: ActionStep[] = [];

    const subPlanExecutedSteps = executedSteps?.filter(step => step.subPlanId === subPlan.id) || [];

    if (subPlanExecutedSteps.length > 0) {
      stepsToExport = subPlanExecutedSteps;
    } else if (distributedSteps && distributedSteps.length > 0) {
      stepsToExport = distributedSteps;
    } else if (plannedSteps && plannedSteps.length > 0) {
      stepsToExport = plannedSteps;
    } else {
      stepsToExport = [];
    }

    const stepsExport = stepsToExport.map(step =>
      this.exportActionStep(step, executedSteps, options)
    );

    const failedSteps = stepsExport.filter(step => step.success === false).length;
    const completedSteps = stepsExport.filter(step => step.success === true).length;

    let status: 'completed' | 'failed' | 'partial';
    if (failedSteps === 0 && completedSteps === stepsExport.length) {
      status = 'completed';
    } else if (completedSteps === 0) {
      status = 'failed';
    } else {
      status = 'partial';
    }

    return {
      id: subPlan.id,
      objective: subPlan.objective,
      description: subPlan.description,
      priority: subPlan.priority,
      estimatedDuration: subPlan.estimatedDuration,
      status,
      steps: stepsExport,
      dependencies: subPlan.dependencies,
      preconditions: subPlan.preconditions,
      expectedOutcome: subPlan.expectedOutcome
    };
  }

  /**
   * Export a single action step
   */
  private static exportActionStep(
    step: ActionStep,
    executedSteps?: ActionStep[],
    options: ExportOptions = {}
  ): ActionStepExport {
    const executedStep = executedSteps?.find(es => es.id === step.id);

    const baseExport: ActionStepExport = {
      id: step.id,
      type: step.type,
      description: step.description,
      target: step.target,
      value: options.includeSensitiveData ? step.value : this.sanitizeValue(step.value),
      url: step.url,
      timeout: step.timeout,
      expected: step.expected,
    };

    if (step.type === 'navigate') {
      let navigationUrl = step.url || step.value;

      if (!navigationUrl || navigationUrl === '[PASSWORD_REDACTED]') {
        navigationUrl = step.url || (typeof step.value === 'string' && step.value.startsWith('http') ? step.value : undefined);
      }

      baseExport.url = navigationUrl;

      if (baseExport.target) {
        baseExport.target = {
          ...baseExport.target,
          description: navigationUrl ? `Navigate to ${navigationUrl}` : (baseExport.target.description || 'Navigation action')
        };
      } else {
        baseExport.target = {
          selector: undefined,
          description: navigationUrl ? `Navigate to ${navigationUrl}` : 'Navigation action'
        };
      }
    }

    if (step.subPlanId) {
      baseExport.subPlanId = step.subPlanId;
    }
    if (step.planReference) {
      baseExport.planReference = step.planReference;
    }
    if (step.refinementLevel !== undefined) {
      baseExport.refinementLevel = step.refinementLevel;
    }

    const wasExecuted = executedStep || (step as any).executed;

    if (wasExecuted) {
      baseExport.success = true;

      if (executedStep) {
        if ('executionTime' in executedStep) {
          baseExport.executionTime = (executedStep as any).executionTime;
        }
        if ('error' in executedStep) {
          baseExport.error = (executedStep as any).error;
          baseExport.success = false;
        }
        if ('screenshot' in executedStep) {
          baseExport.screenshot = (executedStep as any).screenshot;
        }
        if ('extractedData' in executedStep) {
          baseExport.extractedData = (executedStep as any).extractedData;
        }
      }
    } else {
      baseExport.success = undefined;
    }

    return baseExport;
  }

  /**
   * Calculate execution summary statistics
   */
  private static calculateExecutionSummary(
    subPlans: SubPlanExport[],
    taskResult?: TaskResult
  ): ExecutionSummary {
    const totalSubPlans = subPlans.length;
    const completedSubPlans = subPlans.filter(sp => sp.status === 'completed').length;
    const failedSubPlans = subPlans.filter(sp => sp.status === 'failed').length;

    const totalActions = subPlans.reduce((sum, sp) => sum + sp.steps.length, 0);
    const successfulActions = subPlans.reduce((sum, sp) =>
      sum + sp.steps.filter(step => step.success === true).length, 0
    );
    const failedActions = subPlans.reduce((sum, sp) =>
      sum + sp.steps.filter(step => step.success === false).length, 0
    );

    const successRate = totalActions > 0 ? (successfulActions / totalActions) * 100 : 0;
    const averageStepDuration = taskResult?.duration && totalActions > 0
      ? taskResult.duration / totalActions
      : 0;

    return {
      totalSubPlans,
      completedSubPlans,
      failedSubPlans,
      totalActions,
      successfulActions,
      failedActions,
      successRate: Math.round(successRate * 100) / 100,
      averageStepDuration: Math.round(averageStepDuration * 100) / 100
    };
  }

  /**
   * Sanitize sensitive values for export
   */
  private static sanitizeValue(value: any): any {
    if (typeof value === 'string') {
      if (value.startsWith('http://') || value.startsWith('https://')) {
        return value;
      }

      if (value.includes('@') && value.includes('.')) {
        return '[EMAIL_REDACTED]';
      }
      if (value.length > 6 && /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/.test(value)) {
        return '[PASSWORD_REDACTED]';
      }
    }
    return value;
  }

  /**
   * Export to JSON string
   */
  static exportToJson(exportData: ExecutionPlanExport, prettify = true): string {
    return prettify
      ? JSON.stringify(exportData, null, 2)
      : JSON.stringify(exportData);
  }

  /**
   * Save export data to file
   */
  static async saveToFile(
    exportData: ExecutionPlanExport,
    filePath: string,
    prettify = true
  ): Promise<void> {
    const fs = await import('fs/promises');
    const jsonString = this.exportToJson(exportData, prettify);
    await fs.writeFile(filePath, jsonString, 'utf8');
  }

  /**
   * Load export data from file
   */
  static async loadFromFile(filePath: string): Promise<ExecutionPlanExport> {
    const fs = await import('fs/promises');
    const jsonString = await fs.readFile(filePath, 'utf8');
    return JSON.parse(jsonString) as ExecutionPlanExport;
  }

  /**
   * Generate a default filename for the export
   */
  static generateFilename(exportData: ExecutionPlanExport): string {
    const timestamp = new Date(exportData.timestamp).toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .split('.')[0];

    const objective = exportData.globalObjective
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);

    return `execution-plan_${objective}_${timestamp}.json`;
  }
}
