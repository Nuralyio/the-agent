import * as crypto from 'crypto';
import { ActionPlan, ActionStep, PageState, TaskContext } from './types/types';

export interface PlanBuilderOptions {
  estimatedStepDuration?: number;
  defaultPriority?: number;
}

/**
 * Builds action plans from parsed instructions
 */
export class PlanBuilder {
  private options: Required<PlanBuilderOptions>;

  constructor(options: PlanBuilderOptions = {}) {
    this.options = {
      estimatedStepDuration: options.estimatedStepDuration || 1000,
      defaultPriority: options.defaultPriority || 1
    };
  }

  /**
   * Build an action plan from parsed instruction
   */
  buildPlan(
    instruction: string,
    steps: ActionStep[],
    reasoning: string,
    context: TaskContext,
    pageState?: PageState
  ): ActionPlan {
    const planContext = this.buildPlanContext(context, steps.length);

    return {
      id: crypto.randomUUID(),
      objective: instruction,
      steps,
      estimatedDuration: this.calculateEstimatedDuration(steps),
      dependencies: [],
      priority: this.options.defaultPriority,
      context: planContext,
      metadata: {
        reasoning
      }
    };
  }

  /**
   * Build an adapted plan from an existing plan
   */
  buildAdaptedPlan(
    originalPlan: ActionPlan,
    newSteps: ActionStep[],
    reasoning: string
  ): ActionPlan {
    return {
      id: crypto.randomUUID(),
      objective: originalPlan.objective,
      steps: newSteps,
      estimatedDuration: this.calculateEstimatedDuration(newSteps),
      dependencies: originalPlan.dependencies || [],
      priority: originalPlan.priority || this.options.defaultPriority,
      context: {
        ...originalPlan.context,
        totalSteps: newSteps.length
      },
      metadata: {
        reasoning,
        adaptedFrom: originalPlan.id
      }
    };
  }

  /**
   * Build plan context from task context and step count
   */
  private buildPlanContext(context: TaskContext, stepCount: number) {
    return {
      url: context.url,
      pageTitle: context.pageTitle,
      currentStep: 0,
      totalSteps: stepCount,
      variables: {}
    };
  }

  /**
   * Calculate estimated duration based on steps
   */
  private calculateEstimatedDuration(steps: ActionStep[]): number {
    return steps.length * this.options.estimatedStepDuration;
  }
}
