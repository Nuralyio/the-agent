import { AIEngine } from '../../ai/ai-engine';
import { Plan, TaskContext, PageState, ActionPlan } from '../types';
import { ActionPlanner } from './action-planner';
import { HierarchicalPlanManager } from './hierarchical';

/**
 * Planner - Creates multi-level plans with global planning and sub-plan refinement
 * 
 * This is a refactored version that uses modular components for better maintainability
 * and separation of concerns.
 */
export class HierarchicalPlanner {
  private planManager: HierarchicalPlanManager;

  constructor(aiEngine: AIEngine, actionPlanner: ActionPlanner) {
    this.planManager = new HierarchicalPlanManager(aiEngine, actionPlanner);
  }

  /**
   * Create a plan from a complex instruction
   */
  async createHierarchicalPlan(
    instruction: string, 
    context: TaskContext, 
    pageState?: PageState
  ): Promise<Plan> {
    return await this.planManager.createHierarchicalPlan(instruction, context, pageState);
  }

  /**
   * Execute a plan step by step
   */
  async executeHierarchicalPlan(
    hierarchicalPlan: Plan,
    executeActionPlan: (plan: ActionPlan) => Promise<any>
  ): Promise<any> {
    return await this.planManager.executeHierarchicalPlan(hierarchicalPlan, executeActionPlan);
  }

  /**
   * Check if an instruction should use structured planning
   * Note: This method is deprecated as structured planning is now the default
   */
  async shouldUseHierarchicalPlanning(instruction: string): Promise<boolean> {
    return await this.planManager.shouldUseHierarchicalPlanning(instruction);
  }
}
