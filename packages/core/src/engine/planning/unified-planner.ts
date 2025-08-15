import { HierarchicalPlanner } from './hierarchical-planner';
import { ActionPlanner } from './action-planner';
import { AIEngine } from '../../ai/ai-engine';
import { TaskContext, ActionPlan, Plan } from '../../types';
import { executionStream } from '../../streaming/execution-stream';

/**
 * Unified Planner that uses structured planning for all tasks
 * and ActionPlanner only for action execution (not planning)
 * 
 * This ensures consistent planning across all interfaces:
 * - API endpoints
 * - MCP server
 * - CLI tools
 * - Direct usage
 */
export class UnifiedPlanner {
  private hierarchicalPlanner: HierarchicalPlanner;
  private actionPlanner: ActionPlanner;

  constructor(aiEngine: AIEngine) {
    this.actionPlanner = new ActionPlanner(aiEngine);
    this.hierarchicalPlanner = new HierarchicalPlanner(aiEngine, this.actionPlanner);
  }

  /**
   * Always use structured planning for instruction planning
   * This is the main planning method that should be used everywhere
   */
  async planInstruction(instruction: string, context: TaskContext): Promise<Plan> {
    console.log('🧠 UnifiedPlanner: Using structured planning by default');
    
    // Always use structured planning
    const plan = await this.hierarchicalPlanner.createHierarchicalPlan(instruction, context);
    
    console.log(`📋 UnifiedPlanner: Created plan with ${plan.subPlans.length} sub-plans`);
    
    // Stream the plan to the frontend
    console.log('📡 UnifiedPlanner: About to stream plan to frontend');
    executionStream.streamHierarchicalPlanCreated(
      plan,
      plan.globalObjective,
      plan.planningStrategy
    );
    console.log('📡 UnifiedPlanner: Plan streaming call completed');
    
    return plan;
  }

  /**
   * Execute a plan using ActionPlanner for individual action execution
   */
  async executePlan(
    plan: Plan, 
    executePlanFunction: (actionPlan: ActionPlan) => Promise<any>
  ): Promise<any> {
    console.log('� ENTERING UnifiedPlanner.executePlan method - THIS SHOULD APPEAR IN LOGS!!!');
    console.log('�🚀 UnifiedPlanner: Executing plan');
    console.log('🔍 DEBUG: UnifiedPlanner.executePlan called with plan:', {
      id: plan.id,
      subPlansCount: plan.subPlans.length,
      objective: plan.globalObjective
    });
    console.log('🔍 DEBUG: planner exists?', !!this.hierarchicalPlanner);
    console.log('🔍 DEBUG: executePlan method exists?', typeof this.hierarchicalPlanner.executeHierarchicalPlan);
    
    try {
      console.log('🔍 DEBUG: About to call planner.executePlan');
      const result = await this.hierarchicalPlanner.executeHierarchicalPlan(plan, executePlanFunction);
      console.log('🔍 DEBUG: planner.executePlan completed successfully');
      return result;
    } catch (error) {
      console.error('🔍 DEBUG: Error in planner.executePlan:', error);
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
    console.log(`🎯 UnifiedPlanner: Planning and executing instruction: "${instruction}"`);
    
    // Always use structured planning
    const plan = await this.planInstruction(instruction, context);
    
    // Execute the plan
    console.log('🔥 CRITICAL: About to call this.executePlan - THIS SHOULD APPEAR!!!');
    console.log('🔥 CRITICAL: plan object:', { id: plan.id, subPlansCount: plan.subPlans.length });
    console.log('🔥 CRITICAL: executePlanFunction type:', typeof executePlanFunction);
    
    const result = await this.executePlan(plan, executePlanFunction);
    
    console.log('🔥 CRITICAL: this.executePlan returned successfully');
    console.log(`✅ UnifiedPlanner: Completed execution with ${plan.subPlans.length} sub-plans`);
    
    // Include the plan in the result for frontend display
    if (result && typeof result === 'object') {
      result.plan = plan;
      console.log(`📋 UnifiedPlanner: Added plan to result (${plan.subPlans.length} sub-plans)`);
    }
    
    return result;
  }

  /**
   * Create a simple action plan using ActionPlanner (for individual step execution only)
   * This should only be used internally by the planner for sub-plan creation
   */
  async createActionPlan(instruction: string, context: TaskContext): Promise<ActionPlan> {
    console.log('⚙️ UnifiedPlanner: Creating action plan for sub-plan execution');
    return await this.actionPlanner.createActionPlan(instruction, context);
  }

  /**
   * Get the underlying ActionPlanner (for compatibility with existing code)
   */
  getActionPlanner(): ActionPlanner {
    return this.actionPlanner;
  }

  /**
   * Get the underlying planner (for compatibility with existing code)
   */
  getHierarchicalPlanner(): HierarchicalPlanner {
    return this.hierarchicalPlanner;
  }

  /**
   * Check if an instruction would use structured planning
   * Note: This always returns true now since we always use structured planning
   * Kept for backward compatibility
   */
  async shouldUseHierarchicalPlanning(instruction: string): Promise<boolean> {
    console.log('ℹ️ UnifiedPlanner: Always using structured planning (legacy method called)');
    return true; // Always true - structured planning is now the default
  }
}
