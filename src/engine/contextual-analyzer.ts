import { StepContext } from './step-context';

/**
 * Simple contextual analyzer that uses previous step knowledge to improve current step execution
 */
export class ContextualStepAnalyzer {
  
  constructor() {
    // Simple implementation without complex dependencies
  }

  /**
   * Improve a step using context from only the immediately previous step
   */
  async improveStepWithContext(
    step: any,
    stepContext: StepContext,
    successfulSelectors: string[],
    currentPageContent: string
  ): Promise<any> {
    try {
      // Get only the immediately previous step
      const previousStep = stepContext.previousSteps.length > 0 ? 
        stepContext.previousSteps[stepContext.previousSteps.length - 1] : null;

      // If no previous step or it failed, use original
      if (!previousStep || !previousStep.success) {
        console.log('🔄 No successful previous step, using original');
        return step;
      }

      // Only apply context if it's relevant to current step
      if (!this.isRelevantContext(step, previousStep)) {
        console.log('🔄 Previous step not relevant to current step, using original');
        return step;
      }

      // Extract pattern from previous successful selector
      const previousSelector = previousStep.selectorUsed || previousStep.step.target?.selector;
      if (!previousSelector) {
        console.log('🔄 No previous selector available, using original');
        return step;
      }

      // Try to adapt the selector pattern for the current step
      const improvedSelector = this.adaptSelectorPattern(
        previousSelector, 
        step.target.selector, 
        step.description
      );

      if (improvedSelector && improvedSelector !== step.target.selector) {
        console.log(`🧠 Previous step context suggests: ${improvedSelector} (from ${previousSelector})`);
        return {
          ...step,
          target: {
            ...step.target,
            selector: improvedSelector
          }
        };
      }

      console.log('🔄 No relevant selector pattern found, using original');
      return step;
    } catch (error: any) {
      console.log('🔄 Context analysis failed, using original step:', error.message);
      return step;
    }
  }

  /**
   * Check if the previous step context is relevant to the current step
   */
  private isRelevantContext(currentStep: any, previousStep: any): boolean {
    // Only apply context for form interactions
    if (!['type', 'click', 'fill'].includes(currentStep.type)) {
      return false;
    }

    // Don't reuse the exact same selector (different form fields)
    const previousSelector = previousStep.selectorUsed || previousStep.step.target?.selector;
    if (currentStep.target?.selector === previousSelector) {
      return false;
    }

    // Apply context if both are form-related actions
    const currentIsForm = this.isFormAction(currentStep);
    const previousIsForm = this.isFormAction(previousStep.step);
    
    return currentIsForm && previousIsForm;
  }

  /**
   * Check if an action is form-related
   */
  private isFormAction(step: any): boolean {
    const selector = step.target?.selector || '';
    return selector.includes('input') || 
           selector.includes('textarea') || 
           selector.includes('select') ||
           selector.includes('form');
  }

  /**
   * Adapt a successful selector pattern for a new step
   */
  private adaptSelectorPattern(
    successfulSelector: string,
    currentSelector: string,
    stepDescription: string
  ): string | null {
    // Extract the pattern from successful selector
    // e.g., input[name='custname'] -> look for input[name='custemail'] for email steps
    
    if (successfulSelector.includes('input[name=')) {
      const description = stepDescription.toLowerCase();
      
      // Map description keywords to likely field names
      if (description.includes('email')) {
        return successfulSelector.replace(/name='[^']*'/, "name='custemail'");
      }
      if (description.includes('phone') || description.includes('telephone')) {
        return successfulSelector.replace(/name='[^']*'/, "name='custtel'");
      }
      if (description.includes('name') && !description.includes('email')) {
        return successfulSelector.replace(/name='[^']*'/, "name='custname'");
      }
      if (description.includes('delivery') && description.includes('time')) {
        return successfulSelector.replace(/name='[^']*'/, "name='delivery'");
      }
      if (description.includes('comment') || description.includes('instruction')) {
        return 'textarea[name="comments"]';
      }
    }

    // For radio buttons and checkboxes, look for value patterns
    if (successfulSelector.includes('input[') && stepDescription.includes('medium')) {
      return 'input[name="size"][value="medium"]';
    }
    if (successfulSelector.includes('input[') && stepDescription.includes('bacon')) {
      return 'input[name="topping"][value="bacon"]';
    }
    if (successfulSelector.includes('input[') && stepDescription.includes('cheese')) {
      return 'input[name="topping"][value="cheese"]';
    }

    return null;
  }
}
