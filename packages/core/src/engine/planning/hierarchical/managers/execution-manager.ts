import { executionStream } from '../../../../streaming/execution-stream';
import { ActionPlan, Plan } from '../../../../types';
import {
  HierarchicalExecutionContext,
  PlanExecutionResult
} from '../types/hierarchical-planning.types';

/**
 * Manages execution of hierarchical plans with streaming support
 */
export class HierarchicalExecutionManager {
  /**
   * Execute a plan step by step with streaming
   */
  async executeHierarchicalPlan(
    hierarchicalPlan: Plan,
    executeActionPlan: (plan: ActionPlan) => Promise<any>
  ): Promise<PlanExecutionResult> {
    console.log(`🚀 Executing plan: ${hierarchicalPlan.subPlans.length} sub-plans`);

    const context = this.createExecutionContext(hierarchicalPlan);
    const results = [];

    for (let i = 0; i < hierarchicalPlan.subPlans.length; i++) {
      const subPlan = hierarchicalPlan.subPlans[i];

      console.log(`📍 Executing sub-plan ${i + 1}/${hierarchicalPlan.subPlans.length}: ${subPlan.objective}`);
      console.log(`🎯 CRITICAL DEBUG: STARTING sub-plan ${i + 1} iteration`);

      // Update execution context
      context.currentSubPlanIndex = i;

      // Set current sub-plan context for streaming
      executionStream.setCurrentSubPlan(i);

      // Stream sub-plan start event
      executionStream.streamSubPlanStart(i, subPlan);

      // Execute the sub-plan
      const result = await this.executeSubPlan(subPlan, executeActionPlan, hierarchicalPlan.id);

      console.log(`🎯 CRITICAL DEBUG: FINISHED executeActionPlan call for sub-plan ${i + 1}`);
      console.log(`🎯 CRITICAL DEBUG: Result object keys:`, Object.keys(result));
      console.log(`🚨 IMMEDIATE: Sub-plan ${i + 1} result received - PROCESSING COMPLETION NOW!`);

      results.push(result);
      context.results.push(result);

      // Mark sub-plan as completed
      const isSuccess = this.processSubPlanResult(result, i, subPlan, hierarchicalPlan.subPlans.length);

      // Check if sub-plan failed and handle early exit
      if (!isSuccess) {
        console.warn(`⚠️ Sub-plan ${i + 1} failed, stopping hierarchical execution`);
        return this.createExecutionResult(false, results, hierarchicalPlan, i);
      }

      console.log(`✅ Sub-plan ${i + 1} completed successfully, continuing to next sub-plan`);
    }

    // Mark overall execution as complete
    this.completeExecution(context);

    return this.createExecutionResult(true, results, hierarchicalPlan);
  }

  /**
   * Execute a single sub-plan
   */
  private async executeSubPlan(
    subPlan: any,
    executeActionPlan: (plan: ActionPlan) => Promise<any>,
    parentPlanId: string
  ): Promise<any> {
    // Create an action plan from the sub-plan
    const subActionPlan: ActionPlan = {
      id: subPlan.id,
      objective: subPlan.objective,
      steps: subPlan.steps,
      estimatedDuration: subPlan.estimatedDuration,
      dependencies: subPlan.dependencies,
      priority: subPlan.priority,
      planType: 'sub',
      parentPlanId: parentPlanId,
      context: subPlan.context
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
  private completeExecution(context: HierarchicalExecutionContext): void {
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
  private createExecutionContext(hierarchicalPlan: Plan): HierarchicalExecutionContext {
    return {
      currentSubPlanIndex: 0,
      totalSubPlans: hierarchicalPlan.subPlans.length,
      strategy: hierarchicalPlan.planningStrategy,
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
