import { ActionStep, PageState } from '../types';
import { z } from 'zod';

/**
 * Represents the execution result of a step
 */
export interface StepExecutionResult {
  step: ActionStep;
  success: boolean;
  error?: string;
  timestamp: Date;
  pageStateBefore: PageState;
  pageStateAfter?: PageState;
  elementFound?: boolean;
  selectorUsed?: string;
  valueEntered?: string;
}

/**
 * Contextual information about previous steps for AI decision making
 */
export interface StepContext {
  previousSteps: StepExecutionResult[];
  currentStepIndex: number;
  totalSteps: number;
  sessionStartTime: Date;
  formElements?: FormElementContext[];
  pageHistory: PageState[];
}

/**
 * Information about form elements discovered during execution
 */
export interface FormElementContext {
  selector: string;
  type: string;
  name?: string;
  value?: string;
  label?: string;
  required?: boolean;
  filled?: boolean;
  stepIndex?: number;
}

/**
 * LangChain schema for step context analysis
 */
export const StepContextAnalysisSchema = z.object({
  recommendations: z.array(z.object({
    type: z.enum(['SELECTOR_IMPROVEMENT', 'VALUE_ADJUSTMENT', 'TIMING_DELAY', 'ALTERNATIVE_APPROACH']),
    description: z.string(),
    confidence: z.number().min(0).max(1)
  })),
  contextualInsights: z.object({
    elementsDiscovered: z.array(z.string()),
    patternsObserved: z.array(z.string()),
    potentialIssues: z.array(z.string())
  }),
  nextStepGuidance: z.object({
    suggestedSelector: z.string().optional(),
    suggestedValue: z.string().optional(),
    waitConditions: z.array(z.string()).optional(),
    alternativeActions: z.array(z.string()).optional()
  })
});

export type StepContextAnalysis = z.infer<typeof StepContextAnalysisSchema>;

/**
 * Manages the context and history of executed steps for better AI decision making
 */
export class StepContextManager {
  private stepHistory: StepExecutionResult[] = [];
  private formElements: Map<string, FormElementContext> = new Map();
  private pageHistory: PageState[] = [];
  private sessionStartTime: Date = new Date();

  /**
   * Add a completed step to the context
   */
  addStepResult(result: StepExecutionResult): void {
    this.stepHistory.push(result);
    
    // Track form elements if this was a form interaction
    if (result.step.target?.selector && this.isFormInteraction(result.step)) {
      this.updateFormElementContext(result);
    }

    // Track page state changes
    if (result.pageStateAfter) {
      this.pageHistory.push(result.pageStateAfter);
    }
  }

  /**
   * Get the current context for a step
   */
  getCurrentContext(currentStepIndex: number, totalSteps: number): StepContext {
    return {
      previousSteps: [...this.stepHistory],
      currentStepIndex,
      totalSteps,
      sessionStartTime: this.sessionStartTime,
      formElements: Array.from(this.formElements.values()),
      pageHistory: [...this.pageHistory]
    };
  }

  /**
   * Get the last N steps for context
   */
  getRecentSteps(count: number = 3): StepExecutionResult[] {
    return this.stepHistory.slice(-count);
  }

  /**
   * Get form elements discovered so far
   */
  getKnownFormElements(): FormElementContext[] {
    return Array.from(this.formElements.values());
  }

  /**
   * Get successful selectors that have been used
   */
  getSuccessfulSelectors(): string[] {
    return this.stepHistory
      .filter(step => step.success && step.selectorUsed)
      .map(step => step.selectorUsed!)
      .filter((selector, index, array) => array.indexOf(selector) === index);
  }

  /**
   * Get patterns from previous interactions
   */
  getInteractionPatterns(): { selector: string; action: string; success: boolean }[] {
    return this.stepHistory.map(step => ({
      selector: step.selectorUsed || step.step.target?.selector || '',
      action: step.step.type,
      success: step.success
    }));
  }

  /**
   * Clear the context (for new automation sessions)
   */
  reset(): void {
    this.stepHistory = [];
    this.formElements.clear();
    this.pageHistory = [];
    this.sessionStartTime = new Date();
  }

  /**
   * Export context for AI analysis
   */
  exportContextSummary(): string {
    const recentSteps = this.getRecentSteps(5);
    const successfulSelectors = this.getSuccessfulSelectors();
    const formElements = this.getKnownFormElements();

    return JSON.stringify({
      recentSteps: recentSteps.map(step => ({
        type: step.step.type,
        description: step.step.description,
        success: step.success,
        selector: step.selectorUsed || step.step.target?.selector,
        timestamp: step.timestamp.toISOString()
      })),
      successfulSelectors,
      formElements: formElements.map(el => ({
        selector: el.selector,
        type: el.type,
        name: el.name,
        filled: el.filled
      })),
      sessionDuration: Date.now() - this.sessionStartTime.getTime(),
      totalSteps: this.stepHistory.length,
      successRate: this.stepHistory.length > 0 ? 
        this.stepHistory.filter(s => s.success).length / this.stepHistory.length : 0
    }, null, 2);
  }

  private isFormInteraction(step: ActionStep): boolean {
    return (['type', 'click', 'fill'].includes(step.type)) && 
           (step.target?.selector?.includes('input') || 
            step.target?.selector?.includes('textarea') ||
            step.target?.selector?.includes('select') ||
            step.target?.selector?.includes('button') ||
            false);
  }

  private updateFormElementContext(result: StepExecutionResult): void {
    const selector = result.selectorUsed || result.step.target?.selector;
    if (!selector) return;

    const existing = this.formElements.get(selector);
    const extractedName = this.extractNameFromSelector(selector);
    
    const updated: FormElementContext = {
      selector,
      type: this.inferElementType(result.step),
      filled: result.success && (result.step.type === 'type' || result.step.type === 'fill'),
      stepIndex: this.stepHistory.length,
      ...existing
    };

    // Only add optional properties if they have values
    if (extractedName) {
      updated.name = extractedName;
    }
    const valueToSet = result.valueEntered || result.step.value;
    if (valueToSet) {
      updated.value = valueToSet;
    }

    this.formElements.set(selector, updated);
  }

  private inferElementType(step: ActionStep): string {
    if (step.type === 'type' || step.type === 'fill') return 'input';
    if (step.type === 'click') {
      const selector = step.target?.selector?.toLowerCase() || '';
      if (selector.includes('radio')) return 'radio';
      if (selector.includes('checkbox')) return 'checkbox';
      if (selector.includes('button')) return 'button';
      return 'clickable';
    }
    return 'unknown';
  }

  private extractNameFromSelector(selector: string): string | undefined {
    const nameMatch = selector.match(/name=['"]([^'"]+)['"]/);
    if (nameMatch) return nameMatch[1];
    
    const idMatch = selector.match(/id=['"]([^'"]+)['"]/);
    if (idMatch) return idMatch[1];
    
    return undefined;
  }
}
