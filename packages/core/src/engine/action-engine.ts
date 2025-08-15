import { AIEngine } from '../ai/ai-engine';
import { executionStream } from '../streaming/execution-stream';
import {
  ActionPlan,
  BrowserManager,
  ActionEngine as IActionEngine,
  PageState,
  TaskContext,
  TaskResult
} from '../types';
import { ExecutionLogger } from '../utils/execution-logger';
import { ContextualStepAnalyzer } from './analysis/contextual-analyzer';
import { StepContextManager } from './analysis/step-context';
import { ActionExecutor } from './execution/action-executor';
import { PlanExecutionManager } from './execution/plan-execution-manager';
import { StepRefinementManager } from './execution/step-refinement';
import { Planner } from './planning/planner';

/**
 * Core ActionEngine implementation that orchestrates task execution
 *
 * PLANNING ARCHITECTURE:
 * - Uses Planner for ALL task execution
 * - Consistent behavior across all interfaces (API, MCP, CLI, Direct)
 *
 * EXECUTION FLOW:
 * 1. Receive natural language instruction
 * 2. Capture current page state for context
 * 3. Use Planner.planAndExecute() for planning and execution
 * 4. Return structured results with logging and streaming
 */
export class ActionEngine implements IActionEngine {
  private browserManager: BrowserManager;
  private planner: Planner;
  private aiEngine: AIEngine;
  private stepContextManager: StepContextManager;
  private contextualAnalyzer?: ContextualStepAnalyzer;

  // Execution modules
  private actionExecutor: ActionExecutor;
  private stepRefinementManager: StepRefinementManager;
  private planExecutionManager: PlanExecutionManager;

  constructor(
    browserManager: BrowserManager,
    aiEngine: AIEngine
  ) {
    this.browserManager = browserManager;
    this.aiEngine = aiEngine;
    this.planner = new Planner(aiEngine);
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
      this.planner.getActionPlanner(),
      this.stepContextManager,
      this.contextualAnalyzer
    );
    this.planExecutionManager = new PlanExecutionManager(
      browserManager,
      this.planner.getActionPlanner(),
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
      // Use Planner for all tasks
      console.log(`🧠 Using Planner with planning (always default)`);
      console.log(`🔍 ActionEngine: Starting planning for: "${objective}"`);
      return await this.executeWithPlanning(objective, context, logger);

    } catch (error) {
      console.error('❌ Task execution failed:', error);

      // Stream execution completion even on failure
      executionStream.streamExecutionComplete();

      // Finalize logging even on failure
      try {
        await logger.completeSession(false);
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
   * Execute task using Planner
   */
  private async executeWithPlanning(
    objective: string,
    context?: TaskContext,
    logger?: ExecutionLogger
  ): Promise<TaskResult> {
    try {
      // Capture current page state for context
      let pageState: PageState | undefined = undefined;
      try {
        pageState = await this.actionExecutor.captureState();
      } catch (error) {
        console.log('ℹ️ No active page available for context, proceeding with planning');
      }

      // Create context from page state (or empty context if no page)
      const taskContext: TaskContext = context || {
        id: 'task-' + Date.now(),
        objective: objective,
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

      // Use Planner for end-to-end planning and execution
      console.log(`🧠 Planner: Creating and executing plan`);
      const result = await this.planner.planAndExecute(
        objective,
        taskContext,
        (plan: ActionPlan) => this.planExecutionManager.executeActionPlan(plan, logger)
      );

      // Finalize logging
      if (logger) {
        const logPath = await logger.completeSession(result.success);
        console.log(`📋 Complete execution log saved to: ${logPath}`);
      }

      // Stream execution completion
      executionStream.streamExecutionComplete();

      return {
        success: result.success,
        steps: result.results?.flatMap((r: any) => r.steps || []) || [],
        extractedData: null,
        screenshots: result.results?.flatMap((r: any) => r.screenshots || []) || [],
        duration: Date.now() - Date.now(),
        plan: result.plan
      };

    } catch (error) {
      console.error('❌ Planner execution failed:', error);
      throw error;
    }
  }

  /**
   * Parse natural language instruction into structured action plan
   * Uses Planner for consistent planning
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

    // Use the Planner to generate action plan with current page content
    const actionPlan = await this.planner.createActionPlan(instruction, context);

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

}
