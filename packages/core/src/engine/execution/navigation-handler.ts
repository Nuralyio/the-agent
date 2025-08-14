import { AIEngine } from '../../ai/ai-engine';
import { PromptTemplate } from '../../prompt-template';
import { ExecutionStream } from '../../streaming/execution-stream';
import { ActionPlan, ActionStep, ActionType, PageState, TaskResult } from '../../types';
import { ExecutionLogger } from '../../utils/execution-logger';
import { ActionPlanner } from '../planning/action-planner';

/**
 * Handles navigation-aware task execution and planning
 */
export class NavigationHandler {
  private promptTemplate: PromptTemplate;

  constructor(
    private actionPlanner: ActionPlanner,
    private aiEngine: AIEngine
  ) {
    this.promptTemplate = new PromptTemplate();
  }

  /**
   * Use AI to intelligently detect if instruction requires navigation
   */
  async instructionContainsNavigation(instruction: string): Promise<boolean> {
    try {
      const navigationDetectionPrompt = this.promptTemplate.render('navigation-detection', {
        instruction: instruction
      });

      const response = await this.aiEngine.generateText(navigationDetectionPrompt);
      const result = response.content.trim().toLowerCase();

      // Parse AI response - handle various formats
      const isTrue = result === 'true' || result === 'true.' || result.includes('true');
      const isFalse = result === 'false' || result === 'false.' || result.includes('false');

      if (isTrue && !isFalse) {
        console.log('🤖 AI detected navigation required in instruction');
        return true;
      } else if (isFalse && !isTrue) {
        console.log('🤖 AI detected no navigation required');
        return false;
      } else {
        // Fallback: if AI response is unclear, look for obvious URL patterns
        console.warn(`⚠️ AI response unclear: "${result}", using fallback detection`);
        return this.fallbackNavigationDetection(instruction);
      }
    } catch (error) {
      console.warn('⚠️ AI navigation detection failed, using fallback:', error);
      return this.fallbackNavigationDetection(instruction);
    }
  }

  /**
   * Enhanced fallback navigation detection using intelligent pattern analysis
   * Only triggers when AI detection fails or gives unclear responses
   */
  private fallbackNavigationDetection(instruction: string): boolean {
    const normalizedInstruction = instruction.toLowerCase().trim();

    // 1. Explicit URL patterns (highest confidence)
    const urlPatterns = [
      /https?:\/\/[^\s,;]+/i,           // http/https URLs
      /www\.[^\s,;]+\.[a-z]{2,}/i,     // www.domain.com
      /[a-z0-9-]+\.[a-z]{2,}\/[^\s]*/i // domain.com/path
    ];

    for (const pattern of urlPatterns) {
      if (pattern.test(instruction)) {
        console.log('🔧 Fallback: Found explicit URL - navigation required');
        return true;
      }
    }

    // 2. Domain patterns with context
    const domainPattern = /\b[a-zA-Z0-9-]+\.(com|org|net|io|co|edu|gov|app|dev|tech|ai|us|uk|ca|de|fr)\b/i;
    const domainMatch = instruction.match(domainPattern);

    if (domainMatch) {
      // Check if domain appears in navigational context
      const domain = domainMatch[0];
      const domainIndex = instruction.indexOf(domain);
      const contextBefore = instruction.substring(Math.max(0, domainIndex - 20), domainIndex).toLowerCase();
      const contextAfter = instruction.substring(domainIndex + domain.length, domainIndex + domain.length + 20).toLowerCase();

      const navigationContext = /\b(navigate|go|visit|open|browse|head|access|load|check|find|search)\b/;

      if (navigationContext.test(contextBefore) || navigationContext.test(contextAfter)) {
        console.log(`🔧 Fallback: Found domain "${domain}" in navigation context`);
        return true;
      }
    }

    // 3. Strong navigation verbs with target indicators
    const strongNavigationPatterns = [
      /\b(navigate to|go to|visit|browse to|head to|access|open)\s+(?:the\s+)?(?:https?:\/\/|www\.|[a-zA-Z0-9\-]+\.[a-z]{2,}|(?:company|main|external|remote)\s+(?:site|website|page|portal|platform|dashboard)|(?:admin|management)\s+(?:dashboard|console|portal))/i,
      /\b(check out|look at|load up|pull up)\s+(?:the\s+)?(?:https?:\/\/|www\.|[a-zA-Z0-9\-]+\.[a-z]{2,}|(?:external|remote)\s+dashboard)/i
    ];

    for (const pattern of strongNavigationPatterns) {
      if (pattern.test(instruction)) {
        // Additional check: make sure it's not local UI elements
        const localUiElements = /\b(current|this|local)\s+(section|tab|dialog|modal|panel|menu|dropdown|sidebar|toolbar)\b/i;
        if (!localUiElements.test(instruction)) {
          console.log('🔧 Fallback: Found strong navigation verb with web target');
          return true;
        }
      }
    }

    // 4. Known website/service names (even without explicit domains)
    const knownSites = [
      'google', 'youtube', 'facebook', 'twitter', 'linkedin', 'github',
      'stackoverflow', 'amazon', 'ebay', 'wikipedia', 'reddit',
      'orangehrm', 'salesforce', 'jira', 'confluence', 'slack',
      'gmail', 'outlook', 'zoom', 'teams', 'discord'
    ];

    const sitePattern = new RegExp(`\\b(${knownSites.join('|')})\\b`, 'i');
    if (sitePattern.test(instruction)) {
      // Check if mentioned in navigation context
      const navigationVerbs = /\b(go|visit|open|check|access|navigate|browse|head)\b/i;
      const prepositions = /\b(to|on|at|into)\b/i;

      if (navigationVerbs.test(instruction) || prepositions.test(instruction)) {
        console.log('🔧 Fallback: Found known website in navigation context');
        return true;
      }
    }

    // 5. Negative patterns - strong indicators of non-navigation
    const nonNavigationPatterns = [
      /\b(click|type|fill|enter|select|choose|scroll|extract|copy|paste|submit)\b/i,
      /\b(current page|this page|on the page|from the page)\b/i,
      /\b(button|link|field|form|input|dropdown|checkbox|radio)\b/i,
      /\b(the\s+)?(next|previous|settings|admin|main|home)\s+(section|tab|panel|menu|area|page)\b/i,
      /\b(file|print|save|export|import)\s+(dialog|modal|window)\b/i,
      /\b(go to|visit|open)\s+(?:the\s+)?(next|previous|first|last|top|bottom)\b/i
    ];

    const hasNonNavigation = nonNavigationPatterns.some(pattern => pattern.test(instruction));

    if (hasNonNavigation && !domainMatch && !urlPatterns.some(p => p.test(instruction))) {
      console.log('🔧 Fallback: Strong non-navigation indicators found');
      return false;
    }

    // 6. Default to false for unclear cases (conservative approach)
    console.log('🔧 Fallback: No clear navigation pattern detected - defaulting to false');
    return false;
  }

  /**
   * Execute task with navigation-aware planning
   */
  async executeNavigationAwareTask(
    instruction: string,
    logger: ExecutionLogger,
    executionStream: ExecutionStream,
    initialPageState: PageState,
    executeActionPlan: (plan: ActionPlan, logger?: ExecutionLogger) => Promise<TaskResult>,
    captureState: () => Promise<PageState>
  ): Promise<TaskResult> {
    console.log('🌐 Detected navigation in instruction - using smart planning');

    // 1. First, parse just to identify the navigation part
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
      const result = await executeActionPlan(initialPlan, logger);
      const logPath = await logger.completeSession(result.success);

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
    const navResult = await executeActionPlan(navigationPlan, logger);

    if (!navResult.success) {
      const logPath = await logger.completeSession(false);

      console.log(`📋 Complete execution log saved to: ${logPath}`);
      return navResult;
    }

    // 4. Re-capture page state after navigation
    const newPageState = await captureState();
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
      const remainingResult = await executeActionPlan(remainingPlan, logger);

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

      const logPath = await logger.completeSession(finalResult.success);

      console.log(`📋 Complete execution log saved to: ${logPath}`);
      return finalResult;
    }

    // Only navigation was needed
    const logPath = await logger.completeSession(navResult.success);

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
