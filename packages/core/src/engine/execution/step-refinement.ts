import * as crypto from 'crypto';
import { PromptTemplate } from '../../utils/prompt-template';
import { StepContextManager } from '../analysis/step-context';
import { ActionPlanner } from '../planning/action-planner';
import { ActionStep, ActionType, PageState } from '../planning/types/types';

/**
 * Handles step refinement and retry logic with progressive strategies
 */
export class StepRefinementManager {
  private promptTemplate: PromptTemplate;

  constructor(
    private actionPlanner: ActionPlanner,
    private stepContextManager: StepContextManager
  ) {
    this.promptTemplate = new PromptTemplate();
  }


  async executeStepWithRetry(
    step: ActionStep,
    stepContext: any,
    pageState: PageState | undefined,
    maxRetries: number = 3,
    executeStep: (step: ActionStep) => Promise<any>
  ): Promise<any> {
    let lastError: any = null;
    let currentStep = step;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${maxRetries}: ${currentStep.description}`);

        if (currentStep.target?.selector) {
          console.log(`   🎯 Using selector: ${currentStep.target.selector}`);
        }

        const result = await executeStep(currentStep);

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

      if (attempt < maxRetries) {
        console.log(`   🔧 Refining step for retry ${attempt + 1}...`);

        try {
          const refinedStep = await this.progressivelyRefineStep(currentStep, stepContext, pageState, attempt);

          if (refinedStep.target?.selector !== currentStep.target?.selector) {
            console.log(`   🎯 Refined selector: "${currentStep.target?.selector}" → "${refinedStep.target?.selector}"`);
            currentStep = refinedStep;
          } else {
            console.log(`   ⚠️ No refinement found, will retry with same selector`);
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (refinementError) {
          console.log(`   ⚠️ Refinement failed: ${refinementError instanceof Error ? refinementError.message : 'Unknown error'}`);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }

    console.log(`   💥 All ${maxRetries} attempts failed. Final error: ${lastError instanceof Error ? lastError.message : lastError}`);
    return {
      success: false,
      error: `Failed after ${maxRetries} attempts. Last error: ${lastError instanceof Error ? lastError.message : lastError}`,
      canContinue: true
    };
  }


  private async progressivelyRefineStep(
    step: ActionStep,
    stepContext: any,
    pageState: PageState | undefined,
    attempt: number
  ): Promise<ActionStep> {
    if (!pageState) {
      return step;
    }
    return await this.aiRefineStepWithErrorContext(step, stepContext, pageState);
  }


  private async aiRefineStepWithErrorContext(
    step: ActionStep,
    _stepContext: any,
    pageState: PageState
  ): Promise<ActionStep> {
    try {
      const allContent = this.actionPlanner.getAllContentFromPage(pageState.content || '');

      const refinementPrompt = this.promptTemplate.render('step-refinement', {
        stepDescription: step.description,
        failedSelector: step.target?.selector || 'none',
        stepType: step.type,
        pageUrl: pageState.url,
        pageTitle: pageState.title,
        formElements: allContent.forms,
        interactiveElements: allContent.interactions,
        pageContent: allContent.structure
      });

      const refinedPlan = await this.actionPlanner.createActionPlan(refinementPrompt, {
        id: crypto.randomUUID(),
        objective: 'Refine selector based on page content',
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

        const targetToUse = refinedStep.target || step.target;
        if (targetToUse) {
          result.target = targetToUse;
        }

        if (step.value) {
          result.value = step.value;
        }

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


  needsRefinement(step: ActionStep): boolean {
    return step.type === ActionType.CLICK ||
      step.type === ActionType.TYPE ||
      step.type === ActionType.FILL ||
      step.type === ActionType.EXTRACT;
  }


  async refineStepWithContext(
    step: ActionStep,
    stepContext: any,
    pageState: PageState | undefined
  ): Promise<ActionStep> {
    try {
      if (!pageState) {
        console.log('   ⚠️  No page state available, returning original step');
        return step;
      }

      console.log('   🤖 Using AI-powered step refinement with page context...');
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

        const targetToUse = refinedStep.target || step.target;
        if (targetToUse) {
          result.target = targetToUse;
        }

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


  private createContextualPrompt(step: ActionStep, stepContext: any, pageState: PageState): string {
    const recentSteps = stepContext.previousSteps.slice(-2);
    const successfulSelectors = this.stepContextManager.getSuccessfulSelectors();

    const recentStepsText = recentSteps.map((s: any, i: number) =>
      `${i + 1}. ${s.step.type}: ${s.step.description} → ${s.success ? 'SUCCESS' : 'FAILED'} (selector: ${s.selectorUsed || s.step.target?.selector})`
    ).join('\n') || 'No recent steps';

    const allContent = this.actionPlanner.getAllContentFromPage(pageState.content || '');

    return this.promptTemplate.render('context-aware-refinement', {
      recentSteps: recentStepsText,
      successfulSelectors: successfulSelectors.join(', ') || 'None yet',
      stepType: step.type,
      stepDescription: step.description,
      currentSelector: step.target?.selector || 'none',
      pageUrl: pageState.url,
      formElements: allContent.forms,
      interactiveElements: allContent.interactions,
      pageContent: allContent.structure
    });
  }
}
