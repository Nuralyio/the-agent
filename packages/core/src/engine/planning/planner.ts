import { AIEngine } from '../../ai/ai-engine';
import { executionStream } from '../../streaming/execution-stream';
import { ActionPlan, PageState, Plan, TaskContext } from '../../types';
import { ActionPlanner } from './action-planner';
import { HierarchicalPlanManager } from './hierarchical/managers/hierarchical-plan-manager';

/**
 * Main Planner class that handles all planning and execution
 *
 * This is the unified interface for all planning operations:
 * - Creates structured plans from natural language instructions
 * - Executes plans step by step with streaming
 * - Handles both simple and complex multi-step tasks
 *
 * Used across all interfaces:
 * - API endpoints
 * - MCP server
 * - CLI tools
 * - Direct usage
 */
export class Planner {
  private planManager: HierarchicalPlanManager;
  private actionPlanner: ActionPlanner;

  constructor(aiEngine: AIEngine) {
    this.actionPlanner = new ActionPlanner(aiEngine);
    this.planManager = new HierarchicalPlanManager(aiEngine, this.actionPlanner);
  }

  /**
   * Create a structured plan from an instruction
   * This is the main planning method that should be used everywhere
   */
  async planInstruction(instruction: string, context: TaskContext, pageState?: PageState): Promise<Plan> {
    console.log('🧠 Planner: Using structured planning by default');

    const plan = await this.planManager.createHierarchicalPlan(instruction, context, pageState);

    console.log(`📋 Planner: Created plan with ${plan.subPlans.length} sub-plans`);

    // Stream the plan to the frontend
    console.log('📡 Planner: About to stream plan to frontend');
    executionStream.streamHierarchicalPlanCreated(
      plan,
      plan.globalObjective,
      plan.planningStrategy
    );
    console.log('📡 Planner: Plan streaming call completed');

    return plan;
  }

  /**
   * Execute a plan using ActionPlanner for individual action execution
   */
  async executePlan(
    plan: Plan,
    executePlanFunction: (actionPlan: ActionPlan) => Promise<any>
  ): Promise<any> {
    console.log('⚡ ENTERING Planner.executePlan method - THIS SHOULD APPEAR IN LOGS!!!');
    console.log('🚀 Planner: Executing plan');
    console.log('🔍 DEBUG: Planner.executePlan called with plan:', {
      id: plan.id,
      subPlansCount: plan.subPlans.length
    });

    console.log('🔍 DEBUG: planner exists?', !!this.planManager);
    console.log('🔍 DEBUG: executePlan method exists?', typeof this.planManager.executeHierarchicalPlan);

    try {
      console.log('🔍 DEBUG: About to call planManager.executePlan');
      const result = await this.planManager.executeHierarchicalPlan(plan, executePlanFunction);
      console.log('🔍 DEBUG: planManager.executePlan completed successfully');
      return result;
    } catch (error) {
      console.error('🔍 DEBUG: Error in planManager.executePlan:', error);
      throw error;
    }
  }

  /**
   * Complete planning and execution in one call
   * This is the primary method for end-to-end task execution
   */
  async planAndExecute(
    instruction: string,
    context: TaskContext,
    executePlanFunction: (actionPlan: ActionPlan) => Promise<any>
  ): Promise<any> {
    console.log(`🎯 Planner: Planning and executing instruction: "${instruction}"`);

    // Create the plan
    const plan = await this.planInstruction(instruction, context);

    // Execute the plan
    console.log('🔥 CRITICAL: About to call this.executePlan - THIS SHOULD APPEAR!!!');
    console.log('🔥 CRITICAL: plan object:', { id: plan.id, subPlansCount: plan.subPlans.length });
    console.log('🔥 CRITICAL: executePlanFunction type:', typeof executePlanFunction);

    const result = await this.executePlan(plan, executePlanFunction);

    console.log('🔥 CRITICAL: this.executePlan returned successfully');
    console.log(`✅ Planner: Completed execution with ${plan.subPlans.length} sub-plans`);

    // Include the plan in the result for frontend display
    if (result && typeof result === 'object') {
      result.plan = plan;
      console.log(`📋 Planner: Added plan to result (${plan.subPlans.length} sub-plans)`);
    }

    return result;
  }

  /**
   * Create a simple action plan using ActionPlanner (for individual step execution only)
   * This should only be used internally by the planner for sub-plan creation
   */
  async createActionPlan(instruction: string, context: TaskContext): Promise<ActionPlan> {
    console.log(`📝 Planner: Creating simple action plan for: "${instruction}"`);
    return await this.actionPlanner.createActionPlan(instruction, context);
  }

  /**
   * Execute a simple action plan using ActionPlanner
   * This should only be used internally or for simple single-step tasks
   */
  async executeActionPlan(plan: ActionPlan): Promise<any> {
    console.log(`⚙️ Planner: Executing action plan: ${plan.steps.length} steps`);
    // ActionPlanner doesn't have executeActionPlan method - this should be handled by the caller
    throw new Error('Direct action plan execution should be handled by the ActionEngine');
  }

  /**
   * Get the underlying ActionPlanner (for compatibility with existing code)
   */
  getActionPlanner(): ActionPlanner {
    return this.actionPlanner;
  }

  /**
   * Get the underlying plan manager (for compatibility with existing code)
   */
  getPlanManager(): HierarchicalPlanManager {
    return this.planManager;
  }

  /**
   * Check if an instruction would use structured planning
   * Note: This always returns true now since we always use structured planning
   * Kept for backward compatibility
   */
  async shouldUseStructuredPlanning(instruction: string): Promise<boolean> {
    console.log('ℹ️ Planner: Always using structured planning (legacy method called)');
    return true; // Always true - structured planning is now the default
  }

  /**
   * Legacy method name for backward compatibility
   */
  async shouldUseHierarchicalPlanning(instruction: string): Promise<boolean> {
    return this.shouldUseStructuredPlanning(instruction);
  }
}
