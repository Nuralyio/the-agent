import * as crypto from 'crypto';
import { AIEngine } from '../../ai/ai-engine';
import { PromptTemplate } from '../../prompt-template';
import { ActionPlan, ActionStep, ActionType, HierarchicalPlan, SubPlan, PageState, TaskContext } from '../types';
import { ActionPlanner } from './action-planner';

interface GlobalPlanInstruction {
  subObjectives: string[];
  planningStrategy: 'sequential' | 'parallel' | 'conditional';
  reasoning: string;
}

/**
 * HierarchicalPlanner - Creates multi-level plans with global planning and sub-plan refinement
 */
export class HierarchicalPlanner {
  private aiEngine: AIEngine;
  private promptTemplate: PromptTemplate;
  private actionPlanner: ActionPlanner;

  constructor(aiEngine: AIEngine, actionPlanner: ActionPlanner) {
    this.aiEngine = aiEngine;
    this.promptTemplate = new PromptTemplate();
    this.actionPlanner = actionPlanner;
  }

  /**
   * Create a hierarchical plan from a complex instruction
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
      const globalPlan = await this.createGlobalPlan(instruction, context, pageState);
      const globalPlanTime = Date.now() - globalPlanStart;
      console.log(`📋 Global plan created with ${globalPlan.subObjectives.length} sub-objectives (${globalPlanTime}ms)`);

      // Step 2: Create detailed sub-plans for each sub-objective (in parallel)
      const subPlans: SubPlan[] = [];
      
      const subPlanStart = Date.now();
      console.log(`🔍 Creating ${globalPlan.subObjectives.length} sub-plans in parallel...`);
      const subPlanPromises = globalPlan.subObjectives.map((subObjective, i) => 
        this.createSubPlan(
          subObjective,
          instruction,
          context,
          pageState,
          i,
          globalPlan.subObjectives.length
        )
      );
      
      const parallelSubPlans = await Promise.all(subPlanPromises);
      subPlans.push(...parallelSubPlans);
      const subPlanTime = Date.now() - subPlanStart;
      
      console.log(`✅ All ${subPlans.length} sub-plans created in parallel (${subPlanTime}ms)`);

      // Step 3: Create the main action plan with sub-plan references
      const mainActionPlan = this.createMainActionPlan(
        instruction,
        context,
        subPlans,
        globalPlan.planningStrategy
      );

      const hierarchicalPlan: HierarchicalPlan = {
        id: crypto.randomUUID(),
        globalObjective: instruction,
        globalPlan: mainActionPlan,
        subPlans,
        totalEstimatedDuration: subPlans.reduce((total, plan) => total + plan.estimatedDuration, 0),
        planningStrategy: globalPlan.planningStrategy,
        metadata: {
          reasoning: globalPlan.reasoning,
          subObjectiveCount: globalPlan.subObjectives.length,
          createdAt: new Date().toISOString()
        }
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
   * Create global plan by breaking down the instruction into sub-objectives
   */
  private async createGlobalPlan(
    instruction: string,
    context: TaskContext,
    pageState?: PageState
  ): Promise<GlobalPlanInstruction> {
    const systemPrompt = this.promptTemplate.render('hierarchical-planning', {
      pageUrl: pageState?.url || context.url || 'about:blank',
      pageTitle: pageState?.title || context.pageTitle || 'Unknown Page',
    });

    const userPrompt = `Break down this complex instruction into logical sub-objectives:

"${instruction}"

IMPORTANT: You must create AT LEAST 2 separate sub-objectives, preferably 3-6 for complex tasks.

Analyze the instruction and create a high-level plan with clear sub-objectives. Each sub-objective should be:
1. A logical step towards the main goal
2. Specific enough to be executed independently  
3. In the correct order for the overall task
4. Break navigation, authentication, and main actions into separate objectives

For example, if the instruction is "Navigate to https://example.com and create a user account", 
the sub-objectives would be:
1. "Navigate to https://example.com"
2. "Find and access the registration/sign-up page"  
3. "Fill out the registration form with user details"
4. "Submit the registration and verify account creation"

For the given instruction about OrangeHRM and creating a candidate, you should break it down into separate objectives for:
- Navigation to the website
- Authentication/login (if needed)
- Finding the candidate management section
- Creating the new candidate
- Verification of creation

Respond with ONLY valid JSON in this format:
{
  "subObjectives": ["sub-objective 1", "sub-objective 2", "sub-objective 3", ...],
  "planningStrategy": "sequential|parallel|conditional", 
  "reasoning": "Brief explanation of the approach"
}`;

    const response = await this.aiEngine.generateText(userPrompt, systemPrompt);
    
    try {
      // Clean the response content by removing code block markers
      let cleanContent = response.content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.substring(7);
      }
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.substring(3);
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.substring(0, cleanContent.length - 3);
      }
      cleanContent = cleanContent.trim();
      
      const parsed = JSON.parse(cleanContent);
      
      if (!parsed.subObjectives || !Array.isArray(parsed.subObjectives)) {
        throw new Error('Invalid response: missing or invalid subObjectives array');
      }
      
      if (parsed.subObjectives.length === 0) {
        throw new Error('No sub-objectives generated');
      }

      return {
        subObjectives: parsed.subObjectives,
        planningStrategy: parsed.planningStrategy || 'sequential',
        reasoning: parsed.reasoning || 'AI-generated global plan'
      };
      
    } catch (error) {
      console.error('Failed to parse global plan:', error);
      // Fallback: treat the entire instruction as a single objective
      return {
        subObjectives: [instruction],
        planningStrategy: 'sequential',
        reasoning: 'Fallback: single objective due to parsing error'
      };
    }
  }

  /**
   * Create a detailed sub-plan for a specific sub-objective
   */
  private async createSubPlan(
    subObjective: string,
    originalInstruction: string,
    context: TaskContext,
    pageState: PageState | undefined,
    subPlanIndex: number,
    totalSubPlans: number
  ): Promise<SubPlan> {
    // Create enhanced context for the sub-plan
    const subPlanContext: TaskContext = {
      ...context,
      objective: subObjective,
      constraints: [
        ...context.constraints,
        `This is sub-plan ${subPlanIndex + 1} of ${totalSubPlans} for: "${originalInstruction}"`,
        `Focus specifically on: "${subObjective}"`
      ]
    };

    // Use the existing action planner to create detailed steps for this sub-objective
    const actionPlan = await this.actionPlanner.createActionPlan(
      subObjective,
      subPlanContext,
      pageState
    );

    const subPlan: SubPlan = {
      id: crypto.randomUUID(),
      parentId: context.id,
      objective: subObjective,
      description: `Sub-plan ${subPlanIndex + 1}: ${subObjective}`,
      steps: actionPlan.steps,
      estimatedDuration: actionPlan.estimatedDuration,
      priority: subPlanIndex + 1,
      dependencies: subPlanIndex > 0 ? [`sub-plan-${subPlanIndex - 1}`] : [],
      preconditions: subPlanIndex > 0 ? [`Previous sub-plan must be completed`] : undefined,
      expectedOutcome: `Successfully completed: ${subObjective}`,
      refinementLevel: 1,
      context: {
        originalInstruction,
        subPlanIndex,
        totalSubPlans,
        ...actionPlan.context
      }
    };

    return subPlan;
  }

  /**
   * Create the main action plan that references sub-plans
   */
  private createMainActionPlan(
    instruction: string,
    context: TaskContext,
    subPlans: SubPlan[],
    strategy: 'sequential' | 'parallel' | 'conditional'
  ): ActionPlan {
    const steps: ActionStep[] = subPlans.map((subPlan, index) => ({
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

    return {
      id: crypto.randomUUID(),
      objective: instruction,
      steps,
      estimatedDuration: subPlans.reduce((total, plan) => total + plan.estimatedDuration, 0),
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
        hierarchical: true,
        strategy
      }
    };
  }

  /**
   * Check if an instruction should use hierarchical planning
   * Note: This method is deprecated as UnifiedPlanner always uses hierarchical planning
   */
  async shouldUseHierarchicalPlanning(instruction: string): Promise<boolean> {
    // Always return true since hierarchical planning is now the default
    console.log(`🧠 Using hierarchical planning (always default)`);
    return true;
  }

  /**
   * Execute a hierarchical plan step by step
   */
  async executeHierarchicalPlan(
    hierarchicalPlan: HierarchicalPlan,
    executeActionPlan: (plan: ActionPlan) => Promise<any>
  ): Promise<any> {
    console.log(`🚀 Executing hierarchical plan: ${hierarchicalPlan.subPlans.length} sub-plans`);

    const results = [];
    
    for (let i = 0; i < hierarchicalPlan.subPlans.length; i++) {
      const subPlan = hierarchicalPlan.subPlans[i];
      console.log(`📍 Executing sub-plan ${i + 1}/${hierarchicalPlan.subPlans.length}: ${subPlan.objective}`);

      // Create an action plan from the sub-plan
      const subActionPlan: ActionPlan = {
        id: subPlan.id,
        objective: subPlan.objective,
        steps: subPlan.steps,
        estimatedDuration: subPlan.estimatedDuration,
        dependencies: subPlan.dependencies,
        priority: subPlan.priority,
        planType: 'sub',
        parentPlanId: hierarchicalPlan.id,
        context: subPlan.context
      };

      const result = await executeActionPlan(subActionPlan);
      results.push(result);

      if (!result.success) {
        console.warn(`⚠️ Sub-plan ${i + 1} failed, stopping hierarchical execution`);
        break;
      }

      console.log(`✅ Sub-plan ${i + 1} completed successfully`);
    }

    return {
      success: results.every(r => r.success),
      results,
      hierarchicalPlan
    };
  }
}
