import * as crypto from 'crypto';
import { AIEngine } from '../../../../ai/ai-engine';
import { HierarchicalPlan, PageState, TaskContext } from '../../../../types';
import { ActionPlanner } from '../../action-planner';
import { GlobalPlanService } from '../services/global-plan.service';
import { PlanAssemblyService } from '../services/plan-assembly.service';
import { SubPlanService } from '../services/sub-plan.service';
import { HierarchicalExecutionManager } from './execution-manager';

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
  ): Promise<HierarchicalPlan> {
    const startTime = Date.now();
    console.log(`🧠 Creating hierarchical plan for: "${instruction}"`);

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
      const hierarchicalPlan: HierarchicalPlan = {
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
      console.log(`🎯 Hierarchical plan completed: ${subPlans.length} sub-plans, ${hierarchicalPlan.totalEstimatedDuration}ms estimated (Planning took ${totalTime}ms total: ${globalPlanTime}ms global + ${subPlanTime}ms sub-plans)`);

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
    hierarchicalPlan: HierarchicalPlan,
    executeActionPlan: (plan: any) => Promise<any>
  ): Promise<any> {
    return await this.executionManager.executeHierarchicalPlan(
      hierarchicalPlan,
      executeActionPlan
    );
  }

  /**
   * Check if an instruction should use hierarchical planning
   * Note: This method is deprecated as hierarchical planning is now the default
   */
  async shouldUseHierarchicalPlanning(instruction: string): Promise<boolean> {
    // Always return true since hierarchical planning is now the default
    console.log(`🧠 Using hierarchical planning (always default)`);
    return true;
  }
}
