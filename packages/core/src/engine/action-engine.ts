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
import { executionStream, ExecutionStream } from '../streaming/execution-stream';
import { ActionPlanner } from './planning/action-planner';
import { ContextualStepAnalyzer } from './analysis/contextual-analyzer';
import { StepContextManager, StepExecutionResult } from './analysis/step-context';

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
      if (this.instructionContainsNavigation(objective)) {
        return await this.executeNavigationAwareTask(objective, logger, executionStream);
      }

      // 1. Parse the instruction into actionable steps
      const actionPlan = await this.parseInstruction(objective);
      console.log(`📋 Generated ${actionPlan.steps.length} steps`);

      // Stream the plan creation with total step count and step details
      executionStream.streamPlanCreated(actionPlan.steps.length, actionPlan.steps);

      // 2. Execute the action plan with logging
      const result = await this.executeActionPlan(actionPlan, logger);

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
      pageState = await this.captureState();
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
        // Try to capture current page state before executing the step
        let pageStateBefore: PageState | undefined = undefined;
        try {
          pageStateBefore = await this.captureState();
        } catch (error) {
          console.log(`🔍 No active page for step ${i + 1}, proceeding without state context`);
        }

        // Get current step context including previous steps
        const stepContext = this.stepContextManager.getCurrentContext(i, currentPlan.steps.length);

        // Track refinement information
        let refinementInfo: {
          wasRefined: boolean;
          originalStep?: ActionStep;
          refinementReason?: string;
          contextUsed?: {
            previousStepPatterns?: string[];
            pageContentAnalysis?: string;
          };
        } = { wasRefined: false };

        // For steps that need page interaction, refine with context and page content
        if (this.needsRefinement(step)) {
          console.log(`\n🔄 Refining step ${i + 1} with context and page content...`);
          const originalStep = { ...step }; // Keep copy of original step
          const refinedStep = await this.refineStepWithContext(step, stepContext, pageStateBefore);

          // Check if step was actually refined by comparing selectors specifically
          const originalSelector = originalStep.target?.selector;
          const refinedSelector = refinedStep.target?.selector;
          const wasActuallyRefined = originalSelector !== refinedSelector;

          if (wasActuallyRefined) {
            // Determine the refinement reason based on the change
            let refinementReason = 'Context-aware selector improvement';
            if (this.contextualAnalyzer && originalSelector && refinedSelector) {
              if (refinedSelector.includes('name=') && originalSelector.includes('name=')) {
                refinementReason = `Selector pattern adapted from previous successful step`;
              } else if (refinedSelector.includes('textarea') && originalSelector.includes('input')) {
                refinementReason = `Element type refined from input to textarea based on context`;
              } else {
                refinementReason = `Contextual analysis improved selector specificity`;
              }
            }

            refinementInfo = {
              wasRefined: true,
              originalStep: originalStep,
              refinementReason: refinementReason,
              contextUsed: {
                previousStepPatterns: stepContext.previousSteps.map(s => s.selectorUsed || 'N/A').filter(s => s !== 'N/A'),
                pageContentAnalysis: `Refined "${originalSelector}" to "${refinedSelector}"`
              }
            };

            console.log(`   🎯 Selector refined: "${originalSelector}" → "${refinedSelector}"`);
          }

          currentPlan.steps[i] = refinedStep;
          console.log(`   ✨ Context-refined step ${i + 1}: ${refinedStep.description}`);
          if (refinedStep.target?.selector) {
            console.log(`   🎯 Context-improved selector: ${refinedStep.target.selector}`);
          }
        }

        console.log(''); // Add spacing before step execution

        // Stream step start event
        executionStream.streamStepStart(i, currentPlan.steps[i]!);

        // Execute step with retry mechanism and progressive refinement
        const stepResult = await this.executeStepWithRetry(currentPlan.steps[i]!, stepContext, pageStateBefore, 3);

        // Capture page state after step execution (handle navigation gracefully)
        let pageStateAfter: PageState;
        try {
          pageStateAfter = await this.captureState();
        } catch (error) {
          // If context was destroyed due to navigation, wait and try again
          if (error instanceof Error && error.message.includes('Execution context was destroyed')) {
            console.log('🔄 Page navigated during step execution, waiting for new page...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            try {
              pageStateAfter = await this.captureState();
            } catch (retryError) {
              console.warn('⚠️ Could not capture page state after navigation, using minimal state');
              pageStateAfter = {
                url: 'unknown',
                title: 'Navigation in progress',
                content: '',
                screenshot: Buffer.alloc(0),
                timestamp: Date.now(),
                viewport: { width: 1280, height: 720 },
                elements: []
              };
            }
          } else {
            throw error;
          }
        }

        // Create detailed step execution result
        const stepExecutionResult: StepExecutionResult = {
          step: currentPlan.steps[i]!,
          success: stepResult.success,
          timestamp: new Date(),
          ...(pageStateBefore && { pageStateBefore }),
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

        // Stream step completion or error
        if (stepResult.success) {
          executionStream.streamStepComplete(i, currentPlan.steps[i]!, screenshotBuffer);
        } else {
          executionStream.streamStepError(i, currentPlan.steps[i]!, stepResult.error || 'Unknown error');
        }

        // Log step execution with screenshot and refinement info
        if (logger) {
          await logger.logStepExecution(
            i,
            currentPlan.steps[i]!,
            stepExecutionResult,
            pageStateAfter.url,
            pageStateAfter.title,
            screenshotBuffer,
            pageStateAfter.viewport,
            refinementInfo
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
          console.log(''); // Add spacing before failure handling
          console.warn(`⚠️ Step ${i + 1} failed, attempting to adapt remaining plan...`);
          const updatedPageState = await this.captureState();
          const remainingSteps = currentPlan.steps.slice(i + 1);

          if (remainingSteps.length > 0) {
            // Use AI adaptation to handle the extracted data and remaining steps
            const adaptedPlan = await this.actionPlanner.adaptPlan({
              ...currentPlan,
              steps: remainingSteps
            }, updatedPageState);
            const adaptedSteps = adaptedPlan.steps;

            // Update the current plan with adapted steps
            currentPlan.steps = [
              ...currentPlan.steps.slice(0, i + 1),
              ...adaptedSteps
            ];
            console.log(`🔄 Adapted plan: ${adaptedSteps.length} remaining steps updated`);
          }

          if (!stepResult.canContinue) {
            console.warn(`❌ Step ${i + 1} failed critically, stopping execution`);
            break;
          }
        }

        // If step succeeded and extracted data, let AI handle the injection in subsequent steps
        if (stepResult.success && stepResult.data) {
          console.log(`� Extracted data available for AI-powered step adaptation`);
          // Store the extracted data in the plan context for future AI adaptations
          currentPlan.context.extractedData = stepResult.data;
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
      extractedData: currentPlan.context.extractedData,
      duration: 0 // TODO: Add proper timing
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

  /**
   * Execute a step with retry mechanism and progressive refinement
   */
  private async executeStepWithRetry(
    step: ActionStep,
    stepContext: any,
    pageState: PageState | undefined,
    maxRetries: number = 3
  ): Promise<any> {
    let lastError: any = null;
    let currentStep = step;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${maxRetries}: ${currentStep.description}`);

        if (currentStep.target?.selector) {
          console.log(`   🎯 Using selector: ${currentStep.target.selector}`);
        }

        const result = await this.executeStep(currentStep);

        if (result.success) {
          if (attempt > 1) {
            console.log(`   ✅ Step succeeded on attempt ${attempt} after refinement`);
          }
          return result;
        } else {
          lastError = result.error;
          console.log(`   ❌ Attempt ${attempt} failed: ${result.error}`);
        }
      } catch (error) {
        lastError = error;
        console.log(`   ❌ Attempt ${attempt} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // If this wasn't the last attempt, try to refine the step
      if (attempt < maxRetries) {
        console.log(`   🔧 Refining step for retry ${attempt + 1}...`);

        try {
          // Progressive refinement strategies
          const refinedStep = await this.progressivelyRefineStep(currentStep, stepContext, pageState, attempt);

          if (refinedStep.target?.selector !== currentStep.target?.selector) {
            console.log(`   🎯 Refined selector: "${currentStep.target?.selector}" → "${refinedStep.target?.selector}"`);
            currentStep = refinedStep;
          } else {
            console.log(`   ⚠️ No refinement found, will retry with same selector`);
            // Add a small delay before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (refinementError) {
          console.log(`   ⚠️ Refinement failed: ${refinementError instanceof Error ? refinementError.message : 'Unknown error'}`);
          // Add a delay before raw retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    // All retries failed
    console.log(`   💥 All ${maxRetries} attempts failed. Final error: ${lastError instanceof Error ? lastError.message : lastError}`);
    return {
      success: false,
      error: `Failed after ${maxRetries} attempts. Last error: ${lastError instanceof Error ? lastError.message : lastError}`,
      canContinue: true
    };
  }

  /**
   * Apply progressive refinement strategies based on attempt number
   */
  private async progressivelyRefineStep(
    step: ActionStep,
    stepContext: any,
    pageState: PageState | undefined,
    attempt: number
  ): Promise<ActionStep> {
    if (!pageState) {
      return step;
    }

    // Strategy 1 (attempt 1): Use contextual analysis
    if (attempt === 1 && this.contextualAnalyzer) {
      try {
        const successfulSelectors = this.stepContextManager.getSuccessfulSelectors();
        return await this.contextualAnalyzer.improveStepWithContext(
          step,
          stepContext,
          successfulSelectors,
          pageState.content || ''
        );
      } catch (error) {
        console.log(`   ⚠️ Contextual refinement failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Strategy 2 (attempt 2): Try alternative selector patterns
    if (attempt === 2 && step.target?.selector) {
      const alternativeStep = await this.generateAlternativeSelector(step, pageState);
      if (alternativeStep.target?.selector !== step.target.selector) {
        return alternativeStep;
      }
    }

    // Strategy 3 (attempt 3+): Use AI-powered refinement with error context
    if (attempt >= 3) {
      return await this.aiRefineStepWithErrorContext(step, stepContext, pageState);
    }

    return step;
  }

  /**
   * Generate alternative selector patterns for common failure cases
   */
  private async generateAlternativeSelector(step: ActionStep, pageState: PageState): Promise<ActionStep> {
    if (!step.target?.selector) {
      return step;
    }

    const originalSelector = step.target.selector;
    let alternativeSelector = originalSelector;

    // Common selector alternatives based on patterns
    if (originalSelector.includes('li:first-child a')) {
      // Try more specific patterns
      alternativeSelector = originalSelector.replace('li:first-child a', 'li:first-of-type a, .article:first-child a, article:first-child a');
    } else if (originalSelector.includes(':first-child')) {
      // Try :first-of-type instead
      alternativeSelector = originalSelector.replace(':first-child', ':first-of-type');
    } else if (originalSelector.includes('article')) {
      // Try multiple article patterns
      alternativeSelector = 'article a, .article a, [class*="article"] a, .post a, .entry a';
    } else if (originalSelector.startsWith('.') && !originalSelector.includes(' ')) {
      // For single class selectors, try variations
      const className = originalSelector.substring(1);
      alternativeSelector = `${originalSelector}, [class*="${className}"], [class^="${className}"], [class$="${className}"]`;
    }

    if (alternativeSelector !== originalSelector) {
      console.log(`   🔄 Trying alternative selector pattern: ${alternativeSelector}`);

      return {
        ...step,
        target: {
          ...step.target,
          selector: alternativeSelector
        }
      };
    }

    return step;
  }

  /**
   * Use AI to refine step with error context
   */
  private async aiRefineStepWithErrorContext(
    step: ActionStep,
    stepContext: any,
    pageState: PageState
  ): Promise<ActionStep> {
    try {
      const refinementPrompt = `
SELECTOR REFINEMENT WITH ERROR CONTEXT

Failed step: ${step.description}
Failed selector: ${step.target?.selector}
Step type: ${step.type}

Current page URL: ${pageState.url}
Current page title: ${pageState.title}

The selector failed to find elements after multiple attempts. Analyze the page content and provide a better selector.

Focus on finding elements that match the intent: "${step.description}"

Respond with ONLY a JSON object with the refined step.`;

      const refinedPlan = await this.actionPlanner.createActionPlan(refinementPrompt, {
        id: crypto.randomUUID(),
        objective: 'Refine selector',
        constraints: [],
        variables: {},
        history: [],
        currentState: pageState,
        url: pageState.url,
        pageTitle: pageState.title
      }, pageState);

      if (refinedPlan.steps.length > 0) {
        const refinedStep = refinedPlan.steps[0]!;
        const result: ActionStep = {
          id: step.id || 'ai-refined-' + Date.now(),
          type: step.type,
          description: step.description
        };

        // Only assign target if it exists
        const targetToUse = refinedStep.target || step.target;
        if (targetToUse) {
          result.target = targetToUse;
        }

        // Only assign value if it exists
        if (step.value) {
          result.value = step.value;
        }

        // Only assign condition if it exists
        if (step.condition) {
          result.condition = step.condition;
        }

        return result;
      }
    } catch (error) {
      console.log(`   ⚠️ AI refinement failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return step;
  }

  private async executeNavigate(step: ActionStep): Promise<any> {
    let page = await this.browserManager.getCurrentPage();

    // If no page exists, create one
    if (!page) {
      console.log('📄 No active page found, creating new page for navigation...');
      page = await this.browserManager.createPage();
    }

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

    // Wait for the DOM to be ready after navigation
    console.log('⏳ Waiting for page to load...');
    await page.waitForLoad();

    // Give a small additional delay to ensure content is fully rendered
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Stream page change event
    try {
      const currentPage = await this.captureState();
      executionStream.streamPageChange(url, currentPage.title, currentPage.screenshot);
    } catch (error) {
      console.warn('⚠️ Failed to stream page change:', error);
    }

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
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return { success: true };
  }

  private async executeExtract(step: ActionStep): Promise<any> {
    const page = await this.browserManager.getCurrentPage();
    if (!page) throw new Error('No active page');

    // Try the specific selector first if provided
    if (step.target?.selector) {
      try {
        const element = await page.waitForSelector(step.target.selector, { timeout: 5000 });
        if (element) {
          const text = await element.getText();
          if (text?.trim()) {
            console.log(`✅ Extracted text using selector "${step.target.selector}": "${text.trim()}"`);
            return { success: true, data: text.trim() };
          }
        }
      } catch (error) {
        console.log(`⚠️ Primary selector failed, trying generic extraction...`);
      }
    }

    // Fallback: Extract from common content elements
    const contentSelectors = ['p', 'div', 'span', '.info', '.note', '.help'];
    
    for (const selector of contentSelectors) {
      try {
        const elements = await page.findElements(selector);
        for (const element of elements) {
          const text = await element.getText();
          if (text?.trim() && text.length > 5) {
            console.log(`✅ Found text content with selector "${selector}": "${text.trim()}"`);
            return { success: true, data: text.trim() };
          }
        }
      } catch (error) {
        continue;
      }
    }

    // Last resort: extract all page text
    try {
      const allText = await page.evaluate(() => document.body.innerText || '');
      if (allText?.trim()) {
        console.log(`✅ Extracted page content (${allText.length} chars)`);
        return { success: true, data: allText.trim() };
      }
    } catch (error) {
      console.error('Failed to extract page content:', error);
    }

    return { success: false, data: null, error: 'Could not extract any text content' };
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

      // Save screenshots in execution-logs folder instead of root
      const executionLogsDir = path.join(process.cwd(), 'execution-logs');
      const screenshotPath = path.join(executionLogsDir, step.value);

      // Ensure execution-logs directory exists
      if (!fs.existsSync(executionLogsDir)) {
        fs.mkdirSync(executionLogsDir, { recursive: true });
      }

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
      timestamp: Date.now(),
      viewport: { width: 1280, height: 720 }, // Default, should get from actual viewport
      elements: [] // TODO: Implement element extraction
    };
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
    pageState: PageState | undefined
  ): Promise<ActionStep> {
    try {
      // If we have contextual analyzer and page state, use it
      if (this.contextualAnalyzer && pageState) {
        console.log('   🧠 Using contextual analysis for step refinement...');
        const successfulSelectors = this.stepContextManager.getSuccessfulSelectors();
        return await this.contextualAnalyzer.improveStepWithContext(step, stepContext, successfulSelectors, pageState.content || '');
      }

      // Fallback to regular page content refinement with context-aware prompt (if page state available)
      if (!pageState) {
        console.log('   ⚠️  No page state available, returning original step');
        return step;
      }

      const contextualPrompt = this.createContextualPrompt(step, stepContext, pageState);

      const refinedPlan = await this.actionPlanner.createActionPlan(contextualPrompt, {
        id: crypto.randomUUID(),
        objective: 'Contextual step refinement',
        constraints: [],
        variables: {},
        history: [],
        currentState: pageState,
        url: pageState.url,
        pageTitle: pageState.title
      }, pageState);

      if (refinedPlan.steps.length > 0) {
        const refinedStep = refinedPlan.steps[0]!;
        const result: ActionStep = {
          id: crypto.randomUUID(),
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

  /**
   * Check if instruction contains navigation keywords
   */
  private instructionContainsNavigation(instruction: string): boolean {
    const navigationKeywords = [
      'navigate to', 'go to', 'visit', 'open', 'load',
      'browse to', 'head to', 'access', 'http://', 'https://',
      '.com', '.org', '.net', '.io', '.co'
    ];

    const lowerInstruction = instruction.toLowerCase();
    return navigationKeywords.some(keyword => lowerInstruction.includes(keyword));
  }

  /**
   * Execute task with navigation-aware planning
   */
  private async executeNavigationAwareTask(instruction: string, logger: ExecutionLogger, executionStream: ExecutionStream): Promise<TaskResult> {
    console.log('🌐 Detected navigation in instruction - using smart planning');

    // 1. First, parse just to identify the navigation part
    const initialPageState = await this.captureState();
    const initialPlan = await this.actionPlanner.createActionPlan(instruction, {
      id: crypto.randomUUID(),
      objective: instruction,
      constraints: [],
      variables: {},
      history: [],
      currentState: initialPageState,
      url: initialPageState.url,
      pageTitle: initialPageState.title
    }, initialPageState);

    // Stream the initial plan creation
    executionStream.streamPlanCreated(initialPlan.steps.length, initialPlan.steps);

    // 2. Find the first NAVIGATE step
    const navigateStepIndex = initialPlan.steps.findIndex((step: ActionStep) => step.type === ActionType.NAVIGATE);

    if (navigateStepIndex === -1) {
      // No navigation step found, proceed normally
      console.log('⚠️ No navigation step found despite detection, proceeding normally');
      const result = await this.executeActionPlan(initialPlan, logger);
      const logPath = logger.finishSession(result.success);

      console.log(`📋 Complete execution log saved to: ${logPath}`);
      return result;
    }

    console.log(`🎯 Found navigation step at index ${navigateStepIndex}`);

    // 3. Execute navigation step(s) first
    const navigationSteps = initialPlan.steps.slice(0, navigateStepIndex + 1);
    const remainingInstruction = this.extractRemainingInstruction(instruction, navigationSteps);

    // Execute navigation
    const navigationPlan: ActionPlan = {
      id: crypto.randomUUID(),
      objective: 'Navigate to target page',
      steps: navigationSteps,
      estimatedDuration: navigationSteps.length * 1000, // Rough estimate
      dependencies: [],
      priority: 1,
      context: initialPlan.context
    };

    console.log(`🚀 Executing ${navigationSteps.length} navigation step(s)`);
    const navResult = await this.executeActionPlan(navigationPlan, logger);

    if (!navResult.success) {
      const logPath = logger.finishSession(false);

      console.log(`📋 Complete execution log saved to: ${logPath}`);
      return navResult;
    }

    // 4. Re-capture page state after navigation
    const newPageState = await this.captureState();
    console.log(`📄 Re-captured page state: ${newPageState.url}`);

    // 5. Re-plan remaining instruction with new page content
    if (remainingInstruction.trim()) {
      console.log(`🔄 Re-planning remaining instruction: "${remainingInstruction}"`);

      const remainingPlan = await this.actionPlanner.createActionPlan(remainingInstruction, {
        id: crypto.randomUUID(),
        objective: remainingInstruction,
        constraints: [],
        variables: {},
        history: [],
        currentState: newPageState,
        url: newPageState.url,
        pageTitle: newPageState.title
      }, newPageState);

      console.log(`📋 Generated ${remainingPlan.steps.length} additional steps for remaining actions`);

      // Stream the remaining plan creation with step details
      executionStream.streamPlanCreated(remainingPlan.steps.length, remainingPlan.steps);

      // 6. Execute remaining steps
      const remainingResult = await this.executeActionPlan(remainingPlan, logger);

      // 7. Combine results
      const finalResult: TaskResult = {
        success: navResult.success && remainingResult.success,
        steps: [...navResult.steps, ...remainingResult.steps],
        screenshots: [...(navResult.screenshots || []), ...(remainingResult.screenshots || [])],
        duration: (navResult.duration || 0) + (remainingResult.duration || 0)
      };

      // Add error only if there is one
      const errorMessage = remainingResult.error || navResult.error;
      if (errorMessage) {
        finalResult.error = errorMessage;
      }

      const logPath = logger.finishSession(finalResult.success);

      console.log(`📋 Complete execution log saved to: ${logPath}`);
      return finalResult;
    }

    // Only navigation was needed
    const logPath = logger.finishSession(navResult.success);

    console.log(`📋 Complete execution log saved to: ${logPath}`);
    return navResult;
  }

  /**
   * Extract the remaining instruction after navigation
   */
  private extractRemainingInstruction(originalInstruction: string, navigationSteps: ActionStep[]): string {
    // This is a simple approach - remove navigation-related phrases
    let remaining = originalInstruction;

    // Remove common navigation phrases
    const navigationPhrases = [
      /navigate to [^\s,]+/gi,
      /go to [^\s,]+/gi,
      /visit [^\s,]+/gi,
      /open [^\s,]+/gi,
      /browse to [^\s,]+/gi,
      /https?:\/\/[^\s,]+/gi
    ];

    navigationPhrases.forEach(phrase => {
      remaining = remaining.replace(phrase, '');
    });

    // Clean up conjunctions and extra spaces
    remaining = remaining.replace(/^(and |then |, |,)/i, '');
    remaining = remaining.replace(/\s+/g, ' ').trim();

    return remaining;
  }
}
