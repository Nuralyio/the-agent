import { executionStream } from '../../streaming/execution-stream';
import { ActionPlan, Plan } from '../../types';
import { StepContextManager } from '../analysis/step-context';
import { ActionExecutor } from '../execution/action-executor';
import { SubPlanService } from './services/sub-plan.service';
import {
  ExecutionContext,
  PlanExecutionResult
} from './types/planning.types';

/**
 * Manages execution of hierarchical plans with streaming support
 */
export class PlanExecution {
  constructor(
    private subPlanService?: SubPlanService,
    private actionExecutor?: ActionExecutor,
    private stepContextManager?: StepContextManager
  ) {
  }

  /**
   * Set the action executor for page state capture during execution
   */
  setActionExecutor(actionExecutor: ActionExecutor): void {
    this.actionExecutor = actionExecutor;
  }

  /**
   * Execute a plan step by step with streaming
   */
  async executePlan(
    plan: Plan,
    executeActionPlan: (plan: ActionPlan) => Promise<any>
  ): Promise<PlanExecutionResult> {
    console.log(`🚀 Executing plan: ${plan.subPlans.length} sub-plans`);

    const context = this.createExecutionContext(plan);
    const results = [];

    for (let i = 0; i < plan.subPlans.length; i++) {
      const subPlan = plan.subPlans[i];

      console.log(`📍 Executing sub-plan ${i + 1}/${plan.subPlans.length}: ${subPlan.objective}`);
      console.log(`🎯 CRITICAL DEBUG: STARTING sub-plan ${i + 1} iteration`);

      context.currentSubPlanIndex = i;

      executionStream.setCurrentSubPlan(i);

      executionStream.streamSubPlanStart(i, subPlan);

      const result = await this.executeSubPlan(subPlan, executeActionPlan, plan.id);

      results.push(result);
      context.results.push(result);
      const isSuccess = this.processSubPlanResult(result, i, subPlan, plan.subPlans.length);

      if (!isSuccess) {
        console.warn(`⚠️ Sub-plan ${i + 1} failed, but continuing with remaining sub-plans`);
        console.log(`🔄 Continuing execution of remaining ${plan.subPlans.length - i - 1} sub-plans`);
      } else {
        console.log(`✅ Sub-plan ${i + 1} completed successfully, continuing to next sub-plan`);
      }
    }

    this.completeExecution(context);

    const successfulSubPlans = results.filter(r => r.success).length;
    const overallSuccess = successfulSubPlans > 0;

    console.log(`🎯 Execution complete: ${successfulSubPlans}/${results.length} sub-plans succeeded`);

    return this.createExecutionResult(overallSuccess, results, plan);
  }

  /**
   * Execute a single sub-plan
   */
  private async executeSubPlan(
    subPlan: any,
    executeActionPlan: (plan: ActionPlan) => Promise<any>,
    parentPlanId: string
  ): Promise<any> {
    let actualSubPlan = subPlan;

    if (this.subPlanService && (!subPlan.steps || subPlan.steps.length === 0)) {
      console.log(`🔍 Planning actions for sub-plan during execution: ${subPlan.objective}`);

      try {
        let pageState;
        if (this.actionExecutor) {
          try {
            pageState = await this.actionExecutor.captureState();
          } catch (error) {
            console.warn('⚠️ Could not capture page state for action planning, proceeding without it');
            pageState = null;
          }
        }

        if (this.stepContextManager) {
          const freshExecutionContext = this.stepContextManager.exportContextSummary();
          console.log(`🔄 Using fresh execution context for sub-plan planning:`, JSON.stringify(freshExecutionContext, null, 2));

          subPlan.context = {
            ...subPlan.context,
            executionContextSummary: freshExecutionContext
          };
        }

        actualSubPlan = await this.subPlanService.planActionsForExecution(subPlan, pageState);
        console.log(`✅ Actions planned: ${actualSubPlan.steps.length} steps generated`);
      } catch (error) {
        console.error(`❌ Failed to plan actions for sub-plan: ${error}`);
        actualSubPlan = subPlan;
      }
    }

    const subActionPlan: ActionPlan = {
      id: actualSubPlan.id,
      objective: actualSubPlan.objective,
      steps: actualSubPlan.steps,
      estimatedDuration: actualSubPlan.estimatedDuration,
      dependencies: actualSubPlan.dependencies,
      priority: actualSubPlan.priority,
      planType: 'sub',
      parentPlanId: parentPlanId,
      context: actualSubPlan.context
    };

    return await executeActionPlan(subActionPlan);
  }

  /**
   * Process sub-plan execution result
   */
  private processSubPlanResult(
    result: any,
    subPlanIndex: number,
    subPlan: any,
    totalSubPlans: number
  ): boolean {
    const isSuccess = result && result.success === true;
    console.log(`📊 MARKING SUB-PLAN ${subPlanIndex + 1} AS DONE: ${isSuccess ? 'SUCCESS' : 'FAILED'}`);

    try {
      executionStream.streamSubPlanComplete(subPlanIndex, subPlan, isSuccess, totalSubPlans);
      console.log(`✅ Sub-plan ${subPlanIndex + 1} marked as completed in UI`);
    } catch (error) {
      console.error(`❌ ERROR marking sub-plan ${subPlanIndex + 1} as completed:`, error);
    }

    return isSuccess;
  }

  /**
   * Complete the overall execution
   */
  private completeExecution(context: ExecutionContext): void {
    const overallSuccess = context.results.every(r => r.success);
    console.log(`🎯 CRITICAL DEBUG: All sub-plans completed. Overall success: ${overallSuccess}`);

    try {
      console.log(`🔍 DEBUG: About to call streamExecutionComplete for plan`);
      executionStream.streamExecutionComplete();
      console.log(`✅ DEBUG: streamExecutionComplete call completed for plan`);
    } catch (error) {
      console.error(`❌ ERROR in streamExecutionComplete for hierarchical plan:`, error);
    }
  }

  /**
   * Create execution context
   */
  private createExecutionContext(plan: Plan): ExecutionContext {
    return {
      currentSubPlanIndex: 0,
      totalSubPlans: plan.subPlans.length,
      strategy: plan.planningStrategy,
      startTime: Date.now(),
      results: []
    };
  }

  /**
   * Create execution result
   */
  private createExecutionResult(
    success: boolean,
    results: any[],
    hierarchicalPlan: Plan,
    failedAt?: number
  ): PlanExecutionResult {
    return {
      success,
      results,
      plan: hierarchicalPlan,
      executionTime: Date.now(),
      failedAt
    };
  }
}
