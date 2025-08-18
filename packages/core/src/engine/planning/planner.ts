import { AIEngine } from '../../ai/ai-engine';
import { PromptTemplate } from '../../prompt-template';
import { executionStream } from '../../streaming/execution-stream';
import { ActionPlan, PageState, Plan, TaskContext } from '../../types';
// Removed duplicate import of ActionPlanner
import * as crypto from 'crypto';
import { ActionPlanner } from './action-planner';
import { ResponseParser } from './parsers/response-parser';
import { PlanExecution } from './plan-execution';
import { PlanAssemblyService } from './services/plan-assembly.service';
import { SubPlanService } from './services/sub-plan.service';
import { GlobalPlanConfig, GlobalPlanInstruction } from './types/planning.types';

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
  private subPlanService: SubPlanService;
  private planAssemblyService: PlanAssemblyService;
  private executionManager: PlanExecution;
  private actionPlanner: ActionPlanner;
  private aiEngine: AIEngine;
  private promptTemplate: PromptTemplate;
  private responseParser: ResponseParser;

  constructor(aiEngine: AIEngine) {
    this.aiEngine = aiEngine;
    this.actionPlanner = new ActionPlanner(aiEngine);
    this.subPlanService = new SubPlanService(this.actionPlanner);
    this.planAssemblyService = new PlanAssemblyService();
    this.executionManager = new PlanExecution();
    this.promptTemplate = new PromptTemplate();
    this.responseParser = new ResponseParser();
  }

  /**
   * Create a complete hierarchical plan
   */
  async createHierarchicalPlan(
    instruction: string,
    context: TaskContext,
    pageState?: PageState
  ): Promise<Plan> {
    const startTime = Date.now();
    console.log(`🧠 Creating plan for: "${instruction}"`);

    try {
      // Step 1: Create global plan breakdown
      const globalPlanStart = Date.now();
      const globalPlan = await this.createGlobalPlan({
        instruction,
        context,
        pageState
      });
      const globalPlanTime = Date.now() - globalPlanStart;
      console.log(`📋 Global plan created with ${globalPlan.subObjectives.length} sub-objectives (${globalPlanTime}ms)`);

      // Step 2: Create detailed sub-plans for each sub-objective (in parallel)
      const subPlanStart = Date.now();
      const subPlans = await this.subPlanService.createSubPlansInParallel(
        globalPlan.subObjectives,
        instruction,
        context,
        pageState
      );
      const subPlanTime = Date.now() - subPlanStart;
      console.log(`✅ All ${subPlans.length} sub-plans created in parallel (${subPlanTime}ms)`);

      // Step 3: Create the main action plan with sub-plan references
      const mainActionPlan = this.planAssemblyService.createMainActionPlan({
        instruction,
        context,
        subPlans,
        strategy: globalPlan.planningStrategy
      });

      // Step 4: Assemble the complete hierarchical plan
      const hierarchicalPlan: Plan = {
        id: crypto.randomUUID(),
        globalObjective: instruction,
        globalPlan: mainActionPlan,
        subPlans,
        totalEstimatedDuration: this.planAssemblyService.calculateTotalDuration(subPlans),
        planningStrategy: globalPlan.planningStrategy,
        metadata: this.planAssemblyService.createPlanMetadata(
          subPlans,
          globalPlan.planningStrategy,
          globalPlan.reasoning
        )
      };

      const totalTime = Date.now() - startTime;
      console.log(`🎯 Plan completed: ${subPlans.length} sub-plans, ${hierarchicalPlan.totalEstimatedDuration}ms estimated (Planning took ${totalTime}ms total: ${globalPlanTime}ms global + ${subPlanTime}ms sub-plans)`);

      return hierarchicalPlan;

    } catch (error) {
      console.error('❌ Failed to create hierarchical plan:', error);
      throw new Error(`Hierarchical planning failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a structured plan from an instruction
   * This is the main planning method that should be used everywhere
   */
  async planInstruction(instruction: string, context: TaskContext, pageState?: PageState): Promise<Plan> {
    console.log('🧠 Planner: Using structured planning by default');

    const plan = await this.createHierarchicalPlan(instruction, context, pageState);

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
   * Execute a hierarchical plan
   */
  async executeHierarchicalPlan(
    hierarchicalPlan: Plan,
    executeActionPlan: (plan: any) => Promise<any>
  ): Promise<any> {
    return await this.executionManager.executePlan(
      hierarchicalPlan,
      executeActionPlan
    );
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

    try {
      console.log('🔍 DEBUG: About to call executePlan');
      const result = await this.executeHierarchicalPlan(plan, executePlanFunction);
      console.log('🔍 DEBUG: executePlan completed successfully');
      return result;
    } catch (error) {
      console.error('🔍 DEBUG: Error in executePlan:', error);
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

    const plan = await this.planInstruction(instruction, context);
    const result = await this.executePlan(plan, executePlanFunction);
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
   * Create global plan by breaking down instruction into sub-objectives
   */
  async createGlobalPlan(config: GlobalPlanConfig): Promise<GlobalPlanInstruction> {
    const { instruction, context, pageState } = config;

    const systemPrompt = this.promptTemplate.render('hierarchical-planning', {
      pageUrl: pageState?.url || context.url || 'about:blank',
      pageTitle: pageState?.title || context.pageTitle || 'Unknown Page',
    });

    const userPrompt = this.buildGlobalPlanPrompt(instruction);

    console.log(`📋 Creating global plan for: "${instruction}"`);

    const response = await this.aiEngine.generateText(userPrompt, systemPrompt);

    return this.responseParser.parseGlobalPlanResponse(response.content, instruction);
  }

  /**
   * Build the user prompt for global planning
   */
  private buildGlobalPlanPrompt(instruction: string): string {
    return this.promptTemplate.render('global-planning', {
      instruction: instruction
    });
  }

  /**
   * Get the underlying ActionPlanner (for compatibility with existing code)
   */
  getActionPlanner(): ActionPlanner {
    return this.actionPlanner;
  }
}
