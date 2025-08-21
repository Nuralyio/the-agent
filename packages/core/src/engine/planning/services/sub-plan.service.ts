import * as crypto from 'crypto';
import { SubPlan, TaskContext } from '../../../types';
import { ActionPlanner } from '../action-planner';
import { SubPlanConfig } from '../types/planning.types';

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
      subPlanIndex,
      totalSubPlans
    } = config;

    console.log(`🔍 Creating sub-plan ${subPlanIndex + 1}/${totalSubPlans}: ${subObjective}`);

    const subPlanContext = this.createSubPlanContext(
      context,
      subObjective,
      originalInstruction,
      subPlanIndex,
      totalSubPlans
    );

    const subPlan: SubPlan = {
      id: crypto.randomUUID(),
      parentId: context.id,
      objective: subObjective,
      description: `Sub-plan ${subPlanIndex + 1}: ${subObjective}`,
      steps: [],
      estimatedDuration: 0,
      priority: subPlanIndex + 1,
      dependencies: subPlanIndex > 0 ? [`sub-plan-${subPlanIndex - 1}`] : [],
      preconditions: subPlanIndex > 0 ? [`Previous sub-plan must be completed`] : undefined,
      expectedOutcome: `Successfully completed: ${subObjective}`,
      refinementLevel: 1,
      context: subPlanContext
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
   * Plan actions for a sub-plan during execution
   * This method should be called when the sub-plan is about to be executed
   */
  async planActionsForExecution(
    subPlan: SubPlan,
    pageState: any
  ): Promise<SubPlan> {
    console.log(`🔍 Planning actions for sub-plan: ${subPlan.objective}`);

    const enhancedContext = {
      ...subPlan.context,
      id: subPlan.id,
      objective: subPlan.objective,
      constraints: [
        ...(subPlan.context.constraints || []),
        `Sub-plan execution context for: ${subPlan.objective}`
      ],
      executionContextSummary: subPlan.context.executionContextSummary
    };

    const actionPlan = await this.actionPlanner.createActionPlan(
      subPlan.objective,
      enhancedContext,
      pageState
    );

    const updatedSubPlan: SubPlan = {
      ...subPlan,
      steps: actionPlan.steps,
      estimatedDuration: actionPlan.estimatedDuration,
      context: {
        ...subPlan.context,
        ...actionPlan.context
      }
    };

    console.log(`✅ Actions planned for sub-plan with ${updatedSubPlan.steps.length} steps`);

    return updatedSubPlan;
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

}
