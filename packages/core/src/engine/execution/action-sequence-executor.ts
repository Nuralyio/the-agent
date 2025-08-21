import { executionStream } from '../../streaming/execution-stream';
import {
  ActionPlan,
  ActionStep,
  BrowserManager,
  PageState,
  TaskResult
} from '../../types';
import { ExecutionLogger } from '../../utils/logging';
import { StepContextManager, StepExecutionResult } from '../analysis/step-context';
import { ActionPlanner } from '../planning/action-planner';
import { ActionExecutor } from './action-executor';
import { StepRefinementManager } from './step-refinement';

/**
 * Global pause checker for automation coordination
 */
let pauseChecker: (() => Promise<void>) | null = null;

/**
 * Set the global pause checker function
 */
export function setPauseChecker(checker: (() => Promise<void>) | null): void {
  pauseChecker = checker;
}

/**
 * Check for pause if a pause checker is available
 */
async function checkForPause(): Promise<void> {
  if (pauseChecker) {
    await pauseChecker();
  }
}

/**
 * Manages the execution of action plans with dynamic refinement and context awareness
 */
export class ActionSequenceExecutor {
  constructor(
    private browserManager: BrowserManager,
    private actionPlanner: ActionPlanner,
    private stepContextManager: StepContextManager,
    private actionExecutor: ActionExecutor,
    private stepRefinementManager: StepRefinementManager
  ) {
  }

  /**
   * Execute an action plan with context-aware refinement
   */
  async executeActionPlan(plan: ActionPlan, logger?: ExecutionLogger, preserveExtractedData: boolean = true, enableStepRefinement: boolean = false): Promise<TaskResult> {
    const startTime = Date.now();
    const executedSteps: any[] = [];
    const screenshots: Buffer[] = [];
    let currentPlan = plan;

    console.log(`🚀 Executing ${currentPlan.steps.length} steps with context-aware refinement`);

    if (preserveExtractedData) {
      console.log(`💾 Preserving extracted data from previous executions`);
      this.stepContextManager.resetPlanContext();
    } else {
      console.log(`🔄 Full context reset for new session`);
      this.stepContextManager.reset();
    }

    for (let i = 0; i < currentPlan.steps.length; i++) {
      const step = currentPlan.steps[i];
      if (!step) continue;

      await checkForPause();

      console.log(`📍 Step ${i + 1}: ${step.description}`);

      try {
        let pageStateBefore: PageState | undefined = undefined;
        try {
          pageStateBefore = await this.actionExecutor.captureState();
        } catch (error) {
          console.error(`🔍 No active page for step ${i + 1}, proceeding without state context`, error);
        }

        const stepContext = this.stepContextManager.getCurrentContext(i, currentPlan.steps.length);

        let refinementInfo: {
          wasRefined: boolean;
          originalStep?: ActionStep;
          refinementReason?: string;
          contextUsed?: {
            previousStepPatterns?: string[];
            pageContentAnalysis?: string;
          };
        } = { wasRefined: false };

        if (enableStepRefinement && this.stepRefinementManager.needsRefinement(step)) {
          console.log(`\n🔄 Refining step ${i + 1} with AI and page content...`);
          const originalStep = { ...step };
          const contextForRefinement = this.stepContextManager.getCurrentContext(i, currentPlan.steps.length);
          const refinedStep = await this.stepRefinementManager.refineStepWithContext(step, contextForRefinement, pageStateBefore);

          const originalSelector = originalStep.target?.selector;
          const refinedSelector = refinedStep.target?.selector;
          const wasActuallyRefined = originalSelector !== refinedSelector;

          if (wasActuallyRefined) {
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

        console.log('');

        executionStream.streamStepStart(i, currentPlan.steps[i]!);

        const contextForRetry = this.stepContextManager.getCurrentContext(i, currentPlan.steps.length);
        const stepResult = await this.stepRefinementManager.executeStepWithRetry(
          currentPlan.steps[i]!,
          contextForRetry,
          pageStateBefore,
          3,
          (step: ActionStep) => this.actionExecutor.executeStep(step)
        );

        let pageStateAfter: PageState;
        try {
          pageStateAfter = await this.actionExecutor.captureState();
        } catch (error) {
          if (error instanceof Error && error.message.includes('Execution context was destroyed')) {
            console.log('🔄 Page navigated during step execution, waiting for new page...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            try {
              pageStateAfter = await this.actionExecutor.captureState();
            } catch (retryError) {
              console.warn('⚠️ Could not capture page state after navigation, using minimal state' , retryError);
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

        const stepExecutionResult: StepExecutionResult = {
          step: currentPlan.steps[i]!,
          success: stepResult.success,
          timestamp: new Date(),
          ...(pageStateBefore && { pageStateBefore }),
          pageStateAfter,
          elementFound: stepResult.success
        };

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

        if (stepResult.success && stepResult.data && step.type === 'extract') {
          stepExecutionResult.extractedData = stepResult.data;
        }

        this.stepContextManager.addStepResult(stepExecutionResult);

        let screenshotBuffer: Buffer | undefined;
        try {
          screenshotBuffer = await this.browserManager.takeScreenshot();
        } catch (error) {
          console.warn(`⚠️ Failed to take screenshot for step ${i + 1}:`, error);
        }

        if (stepResult.success) {
          executionStream.streamStepComplete(i, currentPlan.steps[i]!, screenshotBuffer);
        } else {
          executionStream.streamStepError(i, currentPlan.steps[i]!, stepResult.error || 'Unknown error');
        }

        if (logger) {
          await logger.logStep({
            stepIndex: i,
            step: currentPlan.steps[i]!,
            result: stepExecutionResult,
            pageUrl: pageStateAfter.url,
            pageTitle: pageStateAfter.title,
            screenshotBuffer,
            viewport: pageStateAfter.viewport,
            refinementInfo
          });
        }

        executedSteps.push({
          step: currentPlan.steps[i]!,
          result: stepResult,
          timestamp: new Date(),
          success: stepResult.success
        });

        if (step.type === 'navigate' || step.type === 'click') {
          if (screenshotBuffer) {
            screenshots.push(screenshotBuffer);
          }
        }

        if (!stepResult.success) {
          console.warn(`⚠️ Step ${i + 1} failed, attempting to adapt remaining plan...`);
          const updatedPageState = await this.actionExecutor.captureState();
          const remainingSteps = currentPlan.steps.slice(i + 1);

          if (remainingSteps.length > 0) {
            const adaptedPlan = await this.actionPlanner.adaptPlan({
              ...currentPlan,
              steps: remainingSteps
            }, updatedPageState);
            const adaptedSteps = adaptedPlan.steps;

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

        if (stepResult.success && stepResult.data) {
          console.log(`� Extracted data available for AI-powered step adaptation`);
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
      duration: Date.now() - startTime
    };
  }
}
