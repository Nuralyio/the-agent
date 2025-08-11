import { PromptTemplate } from '../../prompt-template';
import { ActionStep, ActionType, PageState } from '../../types';
import { ContextualStepAnalyzer } from '../analysis/contextual-analyzer';
import { StepContextManager } from '../analysis/step-context';
import { ActionPlanner } from '../planning/action-planner';

/**
 * Handles step refinement and retry logic with progressive strategies
 */
export class StepRefinementManager {
  private promptTemplate: PromptTemplate;

  constructor(
    private actionPlanner: ActionPlanner,
    private stepContextManager: StepContextManager,
    private contextualAnalyzer?: ContextualStepAnalyzer
  ) {
    this.promptTemplate = new PromptTemplate();
  }

  /**
   * Execute a step with retry mechanism and progressive refinement
   */
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
      const refinementPrompt = this.promptTemplate.render('step-refinement', {
        stepDescription: step.description,
        failedSelector: step.target?.selector || 'none',
        stepType: step.type,
        pageUrl: pageState.url,
        pageTitle: pageState.title
      });

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

  /**
   * Check if a step needs context-aware refinement
   */
  needsRefinement(step: ActionStep): boolean {
    return step.type === ActionType.CLICK ||
      step.type === ActionType.TYPE ||
      step.type === ActionType.FILL ||
      step.type === ActionType.EXTRACT;
  }

  /**
   * Refine a step using both previous step context and current page content
   */
  async refineStepWithContext(
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

    const recentStepsText = recentSteps.map((s: any, i: number) =>
      `${i + 1}. ${s.step.type}: ${s.step.description} → ${s.success ? 'SUCCESS' : 'FAILED'} (selector: ${s.selectorUsed || s.step.target?.selector})`
    ).join('\n') || 'No recent steps';

    return this.promptTemplate.render('context-aware-refinement', {
      recentSteps: recentStepsText,
      successfulSelectors: successfulSelectors.join(', ') || 'None yet',
      stepType: step.type,
      stepDescription: step.description,
      currentSelector: step.target?.selector || 'none',
      pageUrl: pageState.url
    });
  }
}
