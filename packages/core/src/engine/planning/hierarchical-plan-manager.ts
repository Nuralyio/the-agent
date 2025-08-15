import * as crypto from 'crypto';
import { AIEngine } from '../../ai/ai-engine';
import { PageState, Plan, TaskContext } from '../../types';
import { ActionPlanner } from './action-planner';
import { HierarchicalExecutionManager } from './execution-manager';
import { GlobalPlanService } from './services/global-plan.service';
import { PlanAssemblyService } from './services/plan-assembly.service';
import { SubPlanService } from './services/sub-plan.service';

/**
 * Main manager for hierarchical planning that orchestrates all services
 */
export class HierarchicalPlanManager {
  private globalPlanService: GlobalPlanService;
  private subPlanService: SubPlanService;
  private planAssemblyService: PlanAssemblyService;
  private executionManager: HierarchicalExecutionManager;

  constructor(aiEngine: AIEngine, actionPlanner: ActionPlanner) {
    this.globalPlanService = new GlobalPlanService(aiEngine);
    this.subPlanService = new SubPlanService(actionPlanner);
    this.planAssemblyService = new PlanAssemblyService();
    this.executionManager = new HierarchicalExecutionManager();
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
      const globalPlan = await this.globalPlanService.createGlobalPlan({
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
   * Execute a hierarchical plan
   */
  async executeHierarchicalPlan(
    hierarchicalPlan: Plan,
    executeActionPlan: (plan: any) => Promise<any>
  ): Promise<any> {
    return await this.executionManager.executeHierarchicalPlan(
      hierarchicalPlan,
      executeActionPlan
    );
  }

  /**
   * Check if instruction should use structured planning (always true now)
   */
  async shouldUseHierarchicalPlanning(instruction: string): Promise<boolean> {
    return true; // Always use structured planning
  }
}
