import { executionStream } from '../../streaming/execution-stream';
import {
  ActionPlan,
  ActionStep,
  BrowserManager,
  PageState,
  TaskResult
} from '../../types';
import { ExecutionLogger } from '../../utils/execution-logger';
import { StepContextManager, StepExecutionResult } from '../analysis/step-context';
import { ActionPlanner } from '../planning/action-planner';
import { ActionExecutor } from './action-executor';
import { StepRefinementManager } from './step-refinement';

/**
 * Manages the execution of action plans with dynamic refinement and context awareness
 */
export class PlanExecutionManager {
  constructor(
    private browserManager: BrowserManager,
    private actionPlanner: ActionPlanner,
    private stepContextManager: StepContextManager,
    private actionExecutor: ActionExecutor,
    private stepRefinementManager: StepRefinementManager
  ) { }

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
          pageStateBefore = await this.actionExecutor.captureState();
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
        if (this.stepRefinementManager.needsRefinement(step)) {
          console.log(`\n🔄 Refining step ${i + 1} with context and page content...`);
          const originalStep = { ...step }; // Keep copy of original step
          const refinedStep = await this.stepRefinementManager.refineStepWithContext(step, stepContext, pageStateBefore);

          // Check if step was actually refined by comparing selectors specifically
          const originalSelector = originalStep.target?.selector;
          const refinedSelector = refinedStep.target?.selector;
          const wasActuallyRefined = originalSelector !== refinedSelector;

          if (wasActuallyRefined) {
            // Determine the refinement reason based on the change
            let refinementReason = 'Context-aware selector improvement';
            if (originalSelector && refinedSelector) {
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
                previousStepPatterns: stepContext.previousSteps.map((s: any) => s.selectorUsed || 'N/A').filter((s: string) => s !== 'N/A'),
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
        const stepResult = await this.stepRefinementManager.executeStepWithRetry(
          currentPlan.steps[i]!,
          stepContext,
          pageStateBefore,
          3,
          (step: ActionStep) => this.actionExecutor.executeStep(step)
        );

        // Capture page state after step execution (handle navigation gracefully)
        let pageStateAfter: PageState;
        try {
          pageStateAfter = await this.actionExecutor.captureState();
        } catch (error) {
          // If context was destroyed due to navigation, wait and try again
          if (error instanceof Error && error.message.includes('Execution context was destroyed')) {
            console.log('🔄 Page navigated during step execution, waiting for new page...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            try {
              pageStateAfter = await this.actionExecutor.captureState();
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
        if (step.type === 'navigate' || step.type === 'click') {
          if (screenshotBuffer) {
            screenshots.push(screenshotBuffer);
          }
        }

        // If step failed, try to adapt the remaining plan
        if (!stepResult.success) {
          console.warn(`⚠️ Step ${i + 1} failed, attempting to adapt remaining plan...`);
          const updatedPageState = await this.actionExecutor.captureState();
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
          const errorPageState = await this.actionExecutor.captureState();
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
}
