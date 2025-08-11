import { AIEngine } from '../ai/ai-engine';
import {
  ActionPlan,
  BrowserManager,
  ActionEngine as IActionEngine,
  PageState,
  TaskContext,
  TaskResult
} from '../types';
import { ExecutionLogger } from '../utils/execution-logger';
import { executionStream } from '../streaming/execution-stream';
import { ActionPlanner } from './planning/action-planner';
import { ContextualStepAnalyzer } from './analysis/contextual-analyzer';
import { StepContextManager } from './analysis/step-context';
import { ActionExecutor } from './execution/action-executor';
import { StepRefinementManager } from './execution/step-refinement';
import { NavigationHandler } from './execution/navigation-handler';
import { PlanExecutionManager } from './execution/plan-execution-manager';

/**
 * Core ActionEngine implementation that orchestrates task execution
 */
export class ActionEngine implements IActionEngine {
  private browserManager: BrowserManager;
  private actionPlanner: ActionPlanner;
  private aiEngine: AIEngine;
  private stepContextManager: StepContextManager;
  private contextualAnalyzer?: ContextualStepAnalyzer;
  
  // Execution modules
  private actionExecutor: ActionExecutor;
  private stepRefinementManager: StepRefinementManager;
  private navigationHandler: NavigationHandler;
  private planExecutionManager: PlanExecutionManager;

  constructor(
    browserManager: BrowserManager,
    aiEngine: AIEngine
  ) {
    this.browserManager = browserManager;
    this.aiEngine = aiEngine;
    this.actionPlanner = new ActionPlanner(aiEngine);
    this.stepContextManager = new StepContextManager();

    // Initialize contextual analyzer
    try {
      this.contextualAnalyzer = new ContextualStepAnalyzer();
      console.log('✅ Contextual step analyzer initialized');
    } catch (error) {
      console.warn('⚠️ Contextual analyzer not initialized:', error);
    }

    // Initialize execution modules
    this.actionExecutor = new ActionExecutor(browserManager);
    this.stepRefinementManager = new StepRefinementManager(
      this.actionPlanner,
      this.stepContextManager,
      this.contextualAnalyzer
    );
    this.navigationHandler = new NavigationHandler(this.actionPlanner, aiEngine);
    this.planExecutionManager = new PlanExecutionManager(
      browserManager,
      this.actionPlanner,
      this.stepContextManager,
      this.actionExecutor,
      this.stepRefinementManager
    );
  }

  /**
   * Main entry point - execute a natural language instruction
   */
  async executeTask(objective: string, context?: TaskContext): Promise<TaskResult> {
    const startTime = Date.now();
    console.log(`🤖 Processing instruction: "${objective}"`);

    // Initialize execution logger
    const logger = new ExecutionLogger(objective);
    console.log(`📝 Execution logging started: ${logger.getSessionId()}`);

    // Start streaming session
    executionStream.startSession(logger.getSessionId());

    try {
      // Check if instruction contains navigation and handle it specially
      if (await this.navigationHandler.instructionContainsNavigation(objective)) {
        return await this.navigationHandler.executeNavigationAwareTask(
          objective,
          logger,
          executionStream,
          await this.actionExecutor.captureState(),
          (plan, logger) => this.planExecutionManager.executeActionPlan(plan, logger),
          () => this.actionExecutor.captureState()
        );
      }

      // 1. Parse the instruction into actionable steps
      const actionPlan = await this.parseInstruction(objective);
      console.log(`📋 Generated ${actionPlan.steps.length} steps`);

      // Stream the plan creation with total step count and step details
      executionStream.streamPlanCreated(actionPlan.steps.length, actionPlan.steps);

      // 2. Execute the action plan with logging
      const result = await this.planExecutionManager.executeActionPlan(actionPlan, logger);

      // 3. Finalize logging
      const logPath = logger.finishSession(result.success);

      console.log(`📋 Complete execution log saved to: ${logPath}`);

      // Stream execution completion
      executionStream.streamExecutionComplete();

      return result;
    } catch (error) {
      console.error('❌ Task execution failed:', error);

      // Stream execution completion even on failure
      executionStream.streamExecutionComplete();

      // Finalize logging even on failure
      try {
        logger.finishSession(false);
      } catch (logError) {
        console.warn('⚠️ Failed to finalize execution log:', logError);
      }

      return {
        success: false,
        steps: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        screenshots: [],
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Parse natural language instruction into structured action plan
   */
  async parseInstruction(instruction: string): Promise<ActionPlan> {
    // Try to capture current page state for context, but handle case where no page is loaded
    let pageState: PageState | undefined = undefined;
    try {
      pageState = await this.actionExecutor.captureState();
    } catch (error) {
      console.log('🔍 No active page available for context, proceeding with navigation planning');
    }

    // Create context from page state (or empty context if no page)  
    const context: TaskContext = {
      id: 'task-' + Date.now(),
      objective: instruction,
      constraints: [],
      variables: {},
      history: [],
      currentState: pageState || {
        url: '',
        title: '',
        content: '',
        screenshot: Buffer.alloc(0),
        timestamp: Date.now(),
        viewport: { width: 1280, height: 720 },
        elements: []
      },
      url: pageState?.url || '',
      pageTitle: pageState?.title || ''
    };

    // Use the AI-powered planner to generate steps with current page content
    const actionPlan = await this.actionPlanner.createActionPlan(instruction, context, pageState);

    return actionPlan;
  }

  /**
   * Execute a structured action plan with dynamic refinement and context awareness
   */
  async executeActionPlan(plan: ActionPlan, logger?: ExecutionLogger): Promise<TaskResult> {
    return this.planExecutionManager.executeActionPlan(plan, logger);
  }

  /**
   * Get step context manager for external access
   */
  getStepContextManager(): StepContextManager {
    return this.stepContextManager;
  }

  /**
   * Export current execution context
   */
  exportExecutionContext(): string {
    return this.stepContextManager.exportContextSummary();
  }

  /**
   * Capture current page state for context
   */
  async captureState(): Promise<PageState> {
    return this.actionExecutor.captureState();
  }

  /**
   * Check if an instruction contains navigation requirements
   */
  async checkNavigationRequired(instruction: string): Promise<boolean> {
    return this.navigationHandler.instructionContainsNavigation(instruction);
  }
}
