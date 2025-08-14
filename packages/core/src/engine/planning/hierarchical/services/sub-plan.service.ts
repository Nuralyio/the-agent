import * as crypto from 'crypto';
import { SubPlan, TaskContext } from '../../../../types';
import { ActionPlanner } from '../../action-planner';
import { SubPlanConfig } from '../types/hierarchical-planning.types';

/**
 * Service for creating detailed sub-plans from sub-objectives
 */
export class SubPlanService {
  private actionPlanner: ActionPlanner;

  constructor(actionPlanner: ActionPlanner) {
    this.actionPlanner = actionPlanner;
  }

  /**
   * Create a detailed sub-plan for a specific sub-objective
   */
  async createSubPlan(config: SubPlanConfig): Promise<SubPlan> {
    const {
      subObjective,
      originalInstruction,
      context,
      pageState,
      subPlanIndex,
      totalSubPlans
    } = config;

    console.log(`🔍 Creating sub-plan ${subPlanIndex + 1}/${totalSubPlans}: ${subObjective}`);

    // Create enhanced context for the sub-plan
    const subPlanContext = this.createSubPlanContext(
      context,
      subObjective,
      originalInstruction,
      subPlanIndex,
      totalSubPlans
    );

    // Use the existing action planner to create detailed steps for this sub-objective
    const actionPlan = await this.actionPlanner.createActionPlan(
      subObjective,
      subPlanContext,
      pageState
    );

    const subPlan: SubPlan = {
      id: crypto.randomUUID(),
      parentId: context.id,
      objective: subObjective,
      description: `Sub-plan ${subPlanIndex + 1}: ${subObjective}`,
      steps: actionPlan.steps,
      estimatedDuration: actionPlan.estimatedDuration,
      priority: subPlanIndex + 1,
      dependencies: subPlanIndex > 0 ? [`sub-plan-${subPlanIndex - 1}`] : [],
      preconditions: subPlanIndex > 0 ? [`Previous sub-plan must be completed`] : undefined,
      expectedOutcome: `Successfully completed: ${subObjective}`,
      refinementLevel: 1,
      context: {
        originalInstruction,
        subPlanIndex,
        totalSubPlans,
        ...actionPlan.context
      }
    };

    console.log(`✅ Sub-plan ${subPlanIndex + 1} created with ${subPlan.steps.length} steps`);

    return subPlan;
  }

  /**
   * Create multiple sub-plans in parallel
   */
  async createSubPlansInParallel(
    subObjectives: string[],
    originalInstruction: string,
    context: TaskContext,
    pageState: any
  ): Promise<SubPlan[]> {
    console.log(`🔍 Creating ${subObjectives.length} sub-plans in parallel...`);

    const subPlanPromises = subObjectives.map((subObjective, index) =>
      this.createSubPlan({
        subObjective,
        originalInstruction,
        context,
        pageState,
        subPlanIndex: index,
        totalSubPlans: subObjectives.length
      })
    );

    const subPlans = await Promise.all(subPlanPromises);
    console.log(`✅ All ${subPlans.length} sub-plans created in parallel`);

    return subPlans;
  }

  /**
   * Create enhanced context for sub-plan creation
   */
  private createSubPlanContext(
    baseContext: TaskContext,
    subObjective: string,
    originalInstruction: string,
    subPlanIndex: number,
    totalSubPlans: number
  ): TaskContext {
    return {
      ...baseContext,
      objective: subObjective,
      constraints: [
        ...baseContext.constraints,
        `This is sub-plan ${subPlanIndex + 1} of ${totalSubPlans} for: "${originalInstruction}"`,
        `Focus specifically on: "${subObjective}"`
      ]
    };
  }

  /**
   * Validate sub-plan configuration
   */
  validateConfig(config: SubPlanConfig): void {
    if (!config.subObjective || config.subObjective.trim().length === 0) {
      throw new Error('Sub-objective is required for sub-plan creation');
    }

    if (!config.originalInstruction || config.originalInstruction.trim().length === 0) {
      throw new Error('Original instruction is required for sub-plan creation');
    }

    if (!config.context) {
      throw new Error('Task context is required for sub-plan creation');
    }

    if (config.subPlanIndex < 0 || config.totalSubPlans <= 0) {
      throw new Error('Invalid sub-plan index or total sub-plans');
    }
  }
}
