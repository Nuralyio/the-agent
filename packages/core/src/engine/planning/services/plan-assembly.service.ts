import * as crypto from 'crypto';
import { ActionPlan, ActionStep, ActionType, SubPlan } from '../../../types';
import { PlanAssemblyConfig } from '../types/planning.types';

/**
 * Service for assembling execution plans from sub-plans
 */
export class PlanAssemblyService {
  /**
   * Create the main action plan that references sub-plans
   */
  createMainActionPlan(config: PlanAssemblyConfig): ActionPlan {
    const { instruction, context, subPlans, strategy } = config;

    console.log(`🏗️ Assembling main action plan with ${subPlans.length} sub-plans using ${strategy} strategy`);

    const steps = this.createMainActionSteps(subPlans, strategy);

    const mainActionPlan: ActionPlan = {
      id: crypto.randomUUID(),
      objective: instruction,
      steps,
      estimatedDuration: this.calculateTotalDuration(subPlans),
      dependencies: [],
      priority: 1,
      planType: 'global',
      subPlans,
      context: {
        ...context,
        planningStrategy: strategy,
        subPlanCount: subPlans.length
      },
      metadata: {
        execution: true,
        strategy
      }
    };

    console.log(`✅ Main action plan assembled with ${steps.length} steps, estimated duration: ${mainActionPlan.estimatedDuration}ms`);

    return mainActionPlan;
  }

  /**
   * Create action steps that reference sub-plans
   */
  private createMainActionSteps(
    subPlans: SubPlan[],
    strategy: 'sequential' | 'parallel' | 'conditional'
  ): ActionStep[] {
    return subPlans.map((subPlan, index) => ({
      id: crypto.randomUUID(),
      type: ActionType.EXECUTE_SUB_PLAN,
      description: `Execute: ${subPlan.objective}`,
      subPlanId: subPlan.id,
      planReference: {
        type: 'sub-plan' as const,
        id: subPlan.id
      },
      refinementLevel: 0,
      context: {
        subPlanIndex: index,
        totalSubPlans: subPlans.length,
        strategy
      }
    }));
  }

  /**
   * Calculate total estimated duration from sub-plans
   */
  calculateTotalDuration(subPlans: SubPlan[]): number {
    return subPlans.reduce((total, plan) => total + plan.estimatedDuration, 0);
  }

  /**
   * Create plan metadata
   */
  createPlanMetadata(
    subPlans: SubPlan[],
    strategy: string,
    reasoning: string
  ): any {
    return {
      reasoning,
      subObjectiveCount: subPlans.length,
      createdAt: new Date().toISOString(),
      strategy,
      totalSteps: subPlans.reduce((total, plan) => total + plan.steps.length, 0)
    };
  }
}
