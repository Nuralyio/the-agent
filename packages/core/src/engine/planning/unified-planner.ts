import { HierarchicalPlanner } from './hierarchical-planner';
import { ActionPlanner } from './action-planner';
import { AIEngine } from '../../ai/ai-engine';
import { TaskContext, ActionPlan, HierarchicalPlan } from '../../types';
import { executionStream } from '../../streaming/execution-stream';

/**
 * Unified Planner that always uses HierarchicalPlanner for planning
 * and ActionPlanner only for action execution (not planning)
 * 
 * This ensures hierarchical planning is the default across all interfaces:
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
   * Always use hierarchical planning for instruction planning
   * This is the main planning method that should be used everywhere
   */
  async planInstruction(instruction: string, context: TaskContext): Promise<HierarchicalPlan> {
    console.log('🧠 UnifiedPlanner: Using hierarchical planning by default');
    
    // Always use hierarchical planning - no more shouldUseHierarchicalPlanning checks
    const plan = await this.hierarchicalPlanner.createHierarchicalPlan(instruction, context);
    
    console.log(`📋 UnifiedPlanner: Created hierarchical plan with ${plan.subPlans.length} sub-plans`);
    
    // Stream the hierarchical plan to the frontend
    console.log('📡 UnifiedPlanner: About to stream hierarchical plan to frontend');
    executionStream.streamHierarchicalPlanCreated(
      plan,
      plan.globalObjective,
      plan.planningStrategy
    );
    console.log('📡 UnifiedPlanner: Hierarchical plan streaming call completed');
    
    return plan;
  }

  /**
   * Execute a hierarchical plan using ActionPlanner for individual action execution
   */
  async executePlan(
    plan: HierarchicalPlan, 
    executePlanFunction: (actionPlan: ActionPlan) => Promise<any>
  ): Promise<any> {
    console.log('� ENTERING UnifiedPlanner.executePlan method - THIS SHOULD APPEAR IN LOGS!!!');
    console.log('�🚀 UnifiedPlanner: Executing hierarchical plan');
    console.log('🔍 DEBUG: UnifiedPlanner.executePlan called with plan:', {
      id: plan.id,
      subPlansCount: plan.subPlans.length,
      objective: plan.globalObjective
    });
    console.log('🔍 DEBUG: hierarchicalPlanner exists?', !!this.hierarchicalPlanner);
    console.log('🔍 DEBUG: executeHierarchicalPlan method exists?', typeof this.hierarchicalPlanner.executeHierarchicalPlan);
    
    try {
      console.log('🔍 DEBUG: About to call hierarchicalPlanner.executeHierarchicalPlan');
      const result = await this.hierarchicalPlanner.executeHierarchicalPlan(plan, executePlanFunction);
      console.log('🔍 DEBUG: hierarchicalPlanner.executeHierarchicalPlan completed successfully');
      return result;
    } catch (error) {
      console.error('🔍 DEBUG: Error in hierarchicalPlanner.executeHierarchicalPlan:', error);
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
    
    // Always use hierarchical planning
    const plan = await this.planInstruction(instruction, context);
    
    // Execute the hierarchical plan
    console.log('🔥 CRITICAL: About to call this.executePlan - THIS SHOULD APPEAR!!!');
    console.log('🔥 CRITICAL: plan object:', { id: plan.id, subPlansCount: plan.subPlans.length });
    console.log('🔥 CRITICAL: executePlanFunction type:', typeof executePlanFunction);
    
    const result = await this.executePlan(plan, executePlanFunction);
    
    console.log('🔥 CRITICAL: this.executePlan returned successfully');
    console.log(`✅ UnifiedPlanner: Completed execution with ${plan.subPlans.length} sub-plans`);
    
    // Include the hierarchical plan in the result for frontend display
    if (result && typeof result === 'object') {
      result.hierarchicalPlan = plan;
      console.log(`📋 UnifiedPlanner: Added hierarchical plan to result (${plan.subPlans.length} sub-plans)`);
    }
    
    return result;
  }

  /**
   * Create a simple action plan using ActionPlanner (for individual step execution only)
   * This should only be used internally by HierarchicalPlanner for sub-plan creation
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
   * Get the underlying HierarchicalPlanner (for compatibility with existing code)
   */
  getHierarchicalPlanner(): HierarchicalPlanner {
    return this.hierarchicalPlanner;
  }

  /**
   * Check if an instruction would use hierarchical planning
   * Note: This always returns true now since we always use hierarchical planning
   * Kept for backward compatibility
   */
  async shouldUseHierarchicalPlanning(instruction: string): Promise<boolean> {
    console.log('ℹ️ UnifiedPlanner: Always using hierarchical planning (legacy method called)');
    return true; // Always true - hierarchical planning is now the default
  }
}
