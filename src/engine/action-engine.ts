import { AIEngine } from '../ai/ai-engine';
import {
  ActionPlan,
  ActionStep,
  ActionType,
  BrowserManager,
  ExecutionOptions,
  ActionEngine as IActionEngine,
  PageState,
  TaskContext,
  TaskResult
} from '../types';
import { ExecutionLogger } from '../utils/execution-logger';
import { ActionPlanner } from './action-planner';
import { ContextualStepAnalyzer } from './contextual-analyzer';
import { StepContextManager, StepExecutionResult } from './step-context';

/**
 * Core ActionEngine implementation that orchestrates task execution
 */
export class ActionEngine implements IActionEngine {
  private browserManager: BrowserManager;
  private actionPlanner: ActionPlanner;
  private aiEngine: AIEngine;
  private stepContextManager: StepContextManager;
  private contextualAnalyzer?: ContextualStepAnalyzer;

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
  }

  /**
   * Main entry point - execute a natural language instruction
   */
  async executeTask(instruction: string, options?: ExecutionOptions): Promise<TaskResult> {
    console.log(`🤖 Processing instruction: "${instruction}"`);

    // Initialize execution logger
    const logger = new ExecutionLogger(instruction);
    console.log(`📝 Execution logging started: ${logger.getSessionId()}`);

    try {
      // 1. Parse the instruction into actionable steps
      const actionPlan = await this.parseInstruction(instruction);
      console.log(`📋 Generated ${actionPlan.steps.length} steps`);

      // 2. Execute the action plan with logging
      const result = await this.executeActionPlan(actionPlan, logger);

      // 3. Finalize logging
      const logPath = logger.finishSession(result.success);
      console.log(`📋 Complete execution log saved to: ${logPath}`);

      return result;
    } catch (error) {
      console.error('❌ Task execution failed:', error);

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
        screenshots: []
      };
    }
  }

  /**
   * Parse natural language instruction into structured action plan
   */
  async parseInstruction(instruction: string): Promise<ActionPlan> {
    // Capture current page state for context
    const pageState = await this.captureState();

    // Create context from page state
    const context: TaskContext = {
      url: pageState.url,
      pageTitle: pageState.title,
      currentStep: 0,
      totalSteps: 0,
      variables: {}
    };

    // Use the AI-powered planner to generate steps with current page content
    const actionPlan = await this.actionPlanner.createActionPlan(instruction, context, pageState);

    return actionPlan;
  }

  /**
   * Execute a structured action plan with dynamic refinement and context awareness
   */
  async executeActionPlan(plan: ActionPlan, logger?: ExecutionLogger): Promise<TaskResult> {
    const executedSteps: any[] = [];
    const screenshots: Buffer[] = [];
    let currentPlan = plan;

    console.log(`🚀 Executing ${currentPlan.steps.length} steps with context-aware refinement`);

    // Reset context for new plan execution
    this.stepContextManager.reset();

    for (let i = 0; i < currentPlan.steps.length; i++) {
      const step = currentPlan.steps[i];
      if (!step) continue;

      console.log(`📍 Step ${i + 1}: ${step.description}`);

      try {
        // Capture current page state before executing the step
        const pageStateBefore = await this.captureState();

        // Get current step context including previous steps
        const stepContext = this.stepContextManager.getCurrentContext(i, currentPlan.steps.length);

        // For steps that need page interaction, refine with context and page content
        if (this.needsRefinement(step)) {
          console.log(`🔄 Refining step ${i + 1} with context and page content...`);
          const refinedStep = await this.refineStepWithContext(step, stepContext, pageStateBefore);
          currentPlan.steps[i] = refinedStep;
          console.log(`✨ Context-refined step ${i + 1}: ${refinedStep.description}`);
          if (refinedStep.target?.selector) {
            console.log(`🎯 Context-improved selector: ${refinedStep.target.selector}`);
          }
        }

        const stepResult = await this.executeStep(currentPlan.steps[i]!);

        // Capture page state after step execution
        const pageStateAfter = await this.captureState();

        // Create detailed step execution result
        const stepExecutionResult: StepExecutionResult = {
          step: currentPlan.steps[i]!,
          success: stepResult.success,
          timestamp: new Date(),
          pageStateBefore,
          pageStateAfter,
          elementFound: stepResult.success
        };

        // Add optional properties only if they exist
        if (stepResult.error) {
          stepExecutionResult.error = stepResult.error;
        }
        const selector = currentPlan.steps[i]!.target?.selector;
        if (selector) {
          stepExecutionResult.selectorUsed = selector;
        }
        const value = currentPlan.steps[i]!.value;
        if (stepResult.success && value) {
          stepExecutionResult.valueEntered = value;
        }

        // Add step result to context manager
        this.stepContextManager.addStepResult(stepExecutionResult);

        // Take screenshot for logging
        let screenshotBuffer: Buffer | undefined;
        try {
          screenshotBuffer = await this.browserManager.takeScreenshot();
        } catch (error) {
          console.warn(`⚠️ Failed to take screenshot for step ${i + 1}:`, error);
        }

        // Log step execution with screenshot
        if (logger) {
          await logger.logStepExecution(
            i,
            currentPlan.steps[i]!,
            stepExecutionResult,
            pageStateAfter.url,
            pageStateAfter.title,
            screenshotBuffer,
            pageStateAfter.viewport
          );
        }

        executedSteps.push({
          step: currentPlan.steps[i]!,
          result: stepResult,
          timestamp: new Date(),
          success: stepResult.success
        });

        // Take screenshot after important steps for TaskResult
        if (step.type === ActionType.NAVIGATE || step.type === ActionType.CLICK) {
          if (screenshotBuffer) {
            screenshots.push(screenshotBuffer);
          }
        }

        // If step failed, try to adapt the remaining plan
        if (!stepResult.success) {
          console.warn(`⚠️ Step ${i + 1} failed, attempting to adapt remaining plan...`);
          const updatedPageState = await this.captureState();
          const remainingSteps = currentPlan.steps.slice(i + 1);

          if (remainingSteps.length > 0) {
            const adaptedPlan = await this.actionPlanner.adaptPlan({
              ...currentPlan,
              steps: remainingSteps
            }, updatedPageState);

            // Update the current plan with adapted steps
            currentPlan.steps = [
              ...currentPlan.steps.slice(0, i + 1),
              ...adaptedPlan.steps
            ];
            console.log(`🔄 Adapted plan: ${adaptedPlan.steps.length} remaining steps updated`);
          }

          if (!stepResult.canContinue) {
            console.warn(`❌ Step ${i + 1} failed critically, stopping execution`);
            break;
          }
        }
      } catch (error) {
        console.error(`❌ Step ${i + 1} failed:`, error);
        executedSteps.push({
          step,
          result: { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
          timestamp: new Date(),
          success: false
        });

        // Try to adapt the plan even on error
        try {
          const errorPageState = await this.captureState();
          const remainingSteps = currentPlan.steps.slice(i + 1);

          if (remainingSteps.length > 0) {
            const adaptedPlan = await this.actionPlanner.adaptPlan({
              ...currentPlan,
              steps: remainingSteps
            }, errorPageState);

            currentPlan.steps = [
              ...currentPlan.steps.slice(0, i + 1),
              ...adaptedPlan.steps
            ];
            console.log(`🔄 Adapted plan after error: ${adaptedPlan.steps.length} remaining steps updated`);
          }
        } catch (adaptError) {
          console.error('Failed to adapt plan after error:', adaptError);
          break;
        }
      }
    }

    const success = executedSteps.every(s => s.success);
    console.log(success ? '✅ All steps completed successfully' : '❌ Some steps failed');

    return {
      success,
      steps: executedSteps,
      screenshots,
      extractedData: currentPlan.context.extractedData
    };
  }

  /**
   * Execute a single action step
   */
  private async executeStep(step: ActionStep): Promise<any> {
    switch (step.type) {
      case ActionType.NAVIGATE:
        return await this.executeNavigate(step);
      case ActionType.CLICK:
        return await this.executeClick(step);
      case ActionType.TYPE:
        return await this.executeType(step);
      case ActionType.FILL:
        return await this.executeFill(step);
      case ActionType.WAIT:
        return await this.executeWait(step);
      case ActionType.EXTRACT:
        return await this.executeExtract(step);
      case ActionType.SCROLL:
        return await this.executeScroll(step);
      case ActionType.SCREENSHOT:
        return await this.executeScreenshot(step);
      default:
        throw new Error(`Unsupported action type: ${step.type}`);
    }
  }

  private async executeNavigate(step: ActionStep): Promise<any> {
    const page = await this.browserManager.getCurrentPage();
    if (!page) throw new Error('No active page');

    // Get URL from value or target description
    let url = step.value;
    if (!url && step.target?.description) {
      // Check if the target description contains a URL
      const urlMatch = step.target.description.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        url = urlMatch[0];
      } else if (step.target.description.includes('.')) {
        // If it looks like a domain (contains dot), add https://
        url = `https://${step.target.description}`;
      }
    }

    if (!url) {
      throw new Error('No URL specified for navigation');
    }

    console.log(`🌐 Navigating to: ${url}`);
    await page.navigate(url);
    return { success: true };
  }

  private async executeClick(step: ActionStep): Promise<any> {
    const page = await this.browserManager.getCurrentPage();
    if (!page) throw new Error('No active page');

    if (step.target?.selector) {
      await page.click(step.target.selector);
    } else if (step.target?.coordinates) {
      // Use coordinates if selector not available
      throw new Error('Coordinate-based clicking not implemented yet');
    } else {
      throw new Error('No target specified for click action');
    }

    return { success: true };
  }

  private async executeType(step: ActionStep): Promise<any> {
    const page = await this.browserManager.getCurrentPage();
    if (!page) throw new Error('No active page');

    if (step.target?.selector && step.value) {
      await page.type(step.target.selector, step.value);
    } else {
      throw new Error('No target or value specified for type action');
    }

    return { success: true };
  }

  private async executeFill(step: ActionStep): Promise<any> {
    const page = await this.browserManager.getCurrentPage();
    if (!page) throw new Error('No active page');

    if (!step.value) {
      throw new Error('No form data specified for fill action');
    }

    try {
      // Parse form data - can be a single value or JSON object with multiple fields
      let formData: { [key: string]: string } = {};

      if (typeof step.value === 'string') {
        try {
          // Try to parse as JSON first
          formData = JSON.parse(step.value);
        } catch {
          // If not JSON, treat as single value for the target selector
          if (step.target?.selector) {
            formData[step.target.selector] = step.value;
          } else {
            throw new Error('No target selector specified for single value fill');
          }
        }
      } else if (typeof step.value === 'object') {
        formData = step.value as { [key: string]: string };
      }

      console.log(`📝 Filling form with data:`, formData);

      // Fill each field
      for (const [selector, value] of Object.entries(formData)) {
        try {
          console.log(`📝 Filling field "${selector}" with value "${value}"`);

          // Wait for the element to be available
          await page.waitForSelector(selector);

          // Clear the field first by selecting all and typing
          await page.click(selector); // Click to focus
          await page.evaluate(() => document.execCommand('selectAll')); // Select all text
          await page.type(selector, value); // Type the new value (will replace selected text)

        } catch (fieldError) {
          console.warn(`⚠️ Failed to fill field "${selector}":`, fieldError);
          // Continue with other fields even if one fails
        }
      }

      return { success: true, filledFields: Object.keys(formData) };
    } catch (error) {
      console.error('❌ Form fill failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        canContinue: true
      };
    }
  }

  private async executeWait(step: ActionStep): Promise<any> {
    if (step.condition && step.condition.timeout) {
      await new Promise(resolve => setTimeout(resolve, step.condition!.timeout!));
    } else if (step.value) {
      // Support value-based timeout for AI-generated steps
      const timeout = parseInt(step.value.toString());
      await new Promise(resolve => setTimeout(resolve, timeout));
    } else {
      // Default wait time
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    return { success: true };
  }

  private async executeExtract(step: ActionStep): Promise<any> {
    const page = await this.browserManager.getCurrentPage();
    if (!page) throw new Error('No active page');

    // Extract data based on step configuration
    if (step.target?.selector) {
      const element = await page.waitForSelector(step.target.selector);
      const text = await element?.getText();
      return { success: true, data: text };
    }

    return { success: true, data: null };
  }

  private async executeScroll(step: ActionStep): Promise<any> {
    const page = await this.browserManager.getCurrentPage();
    if (!page) throw new Error('No active page');

    // Simple scroll implementation
    await page.evaluate(() => {
      window.scrollBy(0, 500); // Scroll down 500px
    });

    return { success: true };
  }

  private async executeScreenshot(step: ActionStep): Promise<any> {
    const page = await this.browserManager.getCurrentPage();
    if (!page) throw new Error('No active page');

    const screenshot = await page.screenshot();

    // If a filename is provided in the value, save it there
    if (step.value) {
      const fs = require('fs');
      const path = require('path');
      const screenshotPath = path.resolve(step.value);
      fs.writeFileSync(screenshotPath, screenshot);
      console.log(`📸 Screenshot saved to: ${screenshotPath}`);
    }

    return {
      success: true,
      screenshot,
      path: step.value || 'screenshot-buffer'
    };
  }

  /**
   * Capture current page state for context
   */
  async captureState(): Promise<PageState> {
    const page = await this.browserManager.getCurrentPage();
    if (!page) {
      throw new Error('No active page');
    }

    const [screenshot, content, url] = await Promise.all([
      page.screenshot(),
      page.content(),
      page.evaluate(() => window.location.href)
    ]);

    return {
      url,
      title: await page.evaluate(() => document.title),
      content,
      screenshot,
      timestamp: new Date(),
      viewport: { width: 1280, height: 720 } // Default, should get from actual viewport
    };
  }

  /**
   * Refine a step with current page content for better selector identification
   */
  private async refineStepWithPageContent(step: ActionStep, pageState: PageState): Promise<ActionStep> {
    try {
      // Create a refined instruction based on the step and current page
      const refinementPrompt = `Given the current page content, refine this automation step to use the best possible selector.

Current step:
- Type: ${step.type}
- Description: ${step.description}
- Current selector: ${step.target?.selector || 'none'}

Current page URL: ${pageState.url}
Current page title: ${pageState.title}

Instruction: "Find and use the best CSS selector for: ${step.description}"

Respond with ONLY a JSON object with the refined step.`;

      // Use the action planner to refine the step with current page content
      const refinedPlan = await this.actionPlanner.createActionPlan(refinementPrompt, {
        url: pageState.url,
        pageTitle: pageState.title,
        currentStep: 0,
        totalSteps: 1,
        variables: {}
      }, pageState);

      // Return the first step from the refined plan, or original step if refinement fails
      if (refinedPlan.steps.length > 0) {
        const refinedStep = refinedPlan.steps[0]!;
        // Preserve the original step type and description, but use refined selector
        const result: ActionStep = {
          type: step.type,
          description: step.description
        };

        // Only assign target if it exists
        const targetToUse = refinedStep.target || step.target;
        if (targetToUse) {
          result.target = targetToUse;
        }

        // Only assign value if it exists
        const valueToUse = refinedStep.value || step.value;
        if (valueToUse) {
          result.value = valueToUse;
        }

        // Only assign condition if it exists
        if (step.condition) {
          result.condition = step.condition;
        }

        return result;
      }

      return step;
    } catch (error) {
      console.warn('Failed to refine step, using original:', error);
      return step;
    }
  }

  /**
   * Check if a step needs context-aware refinement
   */
  private needsRefinement(step: ActionStep): boolean {
    return step.type === ActionType.CLICK ||
      step.type === ActionType.TYPE ||
      step.type === ActionType.FILL ||
      step.type === ActionType.EXTRACT;
  }

  /**
   * Refine a step using both previous step context and current page content
   */
  private async refineStepWithContext(
    step: ActionStep,
    stepContext: any,
    pageState: PageState
  ): Promise<ActionStep> {
    try {
      // If we have contextual analyzer, use it
      if (this.contextualAnalyzer) {
        console.log('🧠 Using contextual analysis for step refinement...');
        const successfulSelectors = this.stepContextManager.getSuccessfulSelectors();
        return await this.contextualAnalyzer.improveStepWithContext(step, stepContext, successfulSelectors, pageState.content || '');
      }

      // Fallback to regular page content refinement with context-aware prompt
      const contextualPrompt = this.createContextualPrompt(step, stepContext, pageState);

      const refinedPlan = await this.actionPlanner.createActionPlan(contextualPrompt, {
        url: pageState.url,
        pageTitle: pageState.title,
        currentStep: stepContext.currentStepIndex,
        totalSteps: stepContext.totalSteps,
        variables: {}
      }, pageState);

      if (refinedPlan.steps.length > 0) {
        const refinedStep = refinedPlan.steps[0]!;
        const result: ActionStep = {
          type: step.type,
          description: step.description
        };

        // Only assign target if it exists
        const targetToUse = refinedStep.target || step.target;
        if (targetToUse) {
          result.target = targetToUse;
        }

        // Only assign value if it exists
        const valueToUse = refinedStep.value || step.value;
        if (valueToUse) {
          result.value = valueToUse;
        }

        return result;
      }

      return step;
    } catch (error) {
      console.warn('Failed to refine step with context, using original:', error);
      return step;
    }
  }

  /**
   * Create a context-aware prompt for step refinement
   */
  private createContextualPrompt(step: ActionStep, stepContext: any, pageState: PageState): string {
    const recentSteps = stepContext.previousSteps.slice(-2);
    const successfulSelectors = this.stepContextManager.getSuccessfulSelectors();

    return `
CONTEXT-AWARE STEP REFINEMENT

Previous steps (recent):
${recentSteps.map((s: any, i: number) => `${i + 1}. ${s.step.type}: ${s.step.description} → ${s.success ? 'SUCCESS' : 'FAILED'} (selector: ${s.selectorUsed || s.step.target?.selector})`).join('\n')}

Successful selectors used before:
${successfulSelectors.join(', ') || 'None yet'}

Current step to refine:
- Type: ${step.type}
- Description: ${step.description}
- Current selector: ${step.target?.selector || 'none'}

Current page: ${pageState.url}

Based on previous successful actions and patterns, provide the BEST CSS selector for this step.
Prefer selectors that have worked before or follow similar successful patterns.

Respond with ONLY a JSON object containing the refined step.`;
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
}
