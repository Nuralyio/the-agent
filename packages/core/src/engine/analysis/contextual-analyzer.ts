import { StepContext } from './step-context';

/**
 * Generic contextual analyzer that uses previous step knowledge to improve current step execution
 * Provides framework-agnostic selector adaptation and step improvement
 */
export class ContextualStepAnalyzer {

  constructor() {
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
        console.log('   🔄 No successful previous step, using original');
        return step;
      }

      // Only apply context if it's relevant to current step
      if (!this.isRelevantContext(step, previousStep)) {
        console.log('   🔄 Previous step not relevant to current step, using original');
        return step;
      }

      // Extract pattern from previous successful selector
      const previousSelector = previousStep.selectorUsed || previousStep.step.target?.selector;
      if (!previousSelector) {
        console.log('   🔄 No previous selector available, using original');
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

      console.log('   🔄 No relevant selector pattern found, using original');
      return step;
    } catch (error: any) {
      console.log('   🔄 Context analysis failed, using original step:', error.message);
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
    const description = stepDescription.toLowerCase();

    // For menu navigation, create flexible selectors
    if (description.includes('menu') || description.includes('navigate')) {
      const menuKeyword = this.extractKeywordFromDescription(stepDescription);
      if (menuKeyword) {
        return this.generateFlexibleSelector(menuKeyword, 'menu');
      }
    }

    // For form fields, adapt based on input type patterns
    if (successfulSelector.includes('input[name=')) {
      return this.adaptFormFieldSelector(successfulSelector, description);
    }

    // For buttons and interactive elements
    if (successfulSelector.includes('button') || successfulSelector.includes('click')) {
      return this.adaptButtonSelector(successfulSelector, description);
    }

    return null;
  }

  /**
   * Generate flexible selector for any element type
   */
  private generateFlexibleSelector(keyword: string, elementType: string): string {
    const capitalizedKeyword = keyword.charAt(0).toUpperCase() + keyword.slice(1);
    
    // Generic selectors that work across different UI frameworks
    const selectors = [
      `text="${capitalizedKeyword}"`,
      `[aria-label*="${keyword}"]`,
      `[title*="${keyword}"]`,
      `[data-testid*="${keyword}"]`,
      `[class*="${keyword}"]`,
      `[id*="${keyword}"]`,
      `a[href*="${keyword}"]`,
      `button:has-text("${capitalizedKeyword}")`,
      `span:has-text("${capitalizedKeyword}")`,
      `div:has-text("${capitalizedKeyword}")`
    ];

    return selectors.join(', ');
  }

  /**
   * Extract relevant keyword from step description
   */
  private extractKeywordFromDescription(description: string): string | null {
    // Extract the main action word or object from description
    const words = description.toLowerCase().split(' ');
    
    // Look for common UI keywords
    const uiKeywords = ['menu', 'button', 'link', 'form', 'input', 'select', 'login', 'submit', 'save', 'cancel'];
    
    for (const word of words) {
      if (uiKeywords.includes(word)) {
        return word;
      }
    }
    
    // If no specific UI keyword, return the first meaningful word
    const meaningfulWords = words.filter(word => word.length > 3 && !['the', 'and', 'for', 'with'].includes(word));
    return meaningfulWords.length > 0 ? meaningfulWords[0] : null;
  }

  /**
   * Adapt form field selectors based on description
   */
  private adaptFormFieldSelector(successfulSelector: string, description: string): string | null {
    // Generic form field patterns
    if (description.includes('email')) {
      return 'input[type="email"], input[name*="email"], input[id*="email"]';
    }
    if (description.includes('password')) {
      return 'input[type="password"], input[name*="password"], input[id*="password"]';
    }
    if (description.includes('name')) {
      return 'input[name*="name"], input[id*="name"], input[placeholder*="name"]';
    }
    if (description.includes('phone')) {
      return 'input[type="tel"], input[name*="phone"], input[name*="tel"], input[id*="phone"]';
    }
    if (description.includes('text') || description.includes('comment')) {
      return 'textarea, input[type="text"], input[name*="comment"], input[name*="message"]';
    }
    
    return null;
  }

  /**
   * Adapt button selectors based on description
   */
  private adaptButtonSelector(successfulSelector: string, description: string): string | null {
    // Generic button patterns
    if (description.includes('submit') || description.includes('save')) {
      return 'button[type="submit"], input[type="submit"], button:has-text("Submit"), button:has-text("Save")';
    }
    if (description.includes('cancel')) {
      return 'button:has-text("Cancel"), a:has-text("Cancel"), [role="button"]:has-text("Cancel")';
    }
    if (description.includes('login') || description.includes('sign in')) {
      return 'button:has-text("Login"), button:has-text("Sign"), input[type="submit"]';
    }
    
    return null;
  }
}
