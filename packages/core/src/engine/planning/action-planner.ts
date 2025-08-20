import { PromptTemplate } from '../../prompt-template';
import { AIEngine } from '../ai-engine';
import { ActionPlan, PageState, TaskContext } from './types/types';
import {
  AIResponseParser,
  AIService,
  ContentExtractor,
  ParsedInstruction,
  PlanBuilder
} from './utils';

/**
 * ActionPlanner - Converts natural language instructions into actionable steps using AI
 *
 * This class has been refactored to use the Single Responsibility Principle:
 * - AIService: Handles AI communication
 * - AIResponseParser: Parses and validates AI responses
 * - ContentExtractor: Extracts relevant content from page HTML
 * - PlanBuilder: Builds action plans from parsed instructions
 */
export class ActionPlanner {
  private aiService: AIService;
  private responseParser: AIResponseParser;
  private contentExtractor: ContentExtractor;
  private planBuilder: PlanBuilder;
  private promptTemplate: PromptTemplate;

  constructor(aiEngine: AIEngine) {
    this.aiService = new AIService(aiEngine);
    this.responseParser = new AIResponseParser();
    this.contentExtractor = new ContentExtractor();
    this.planBuilder = new PlanBuilder();
    this.promptTemplate = new PromptTemplate();
  }

  /**
   * Extract structured content from page HTML for external use
   */
  extractStructuredContentFromPage(pageContent: string): any {
    return this.contentExtractor.extractStructuredContent(pageContent);
  }

  /**
   * Get all content in simplified format for external use
   */
  getAllContentFromPage(pageContent: string): {
    structure: string;
    forms: string;
    interactions: string;
  } {
    return this.contentExtractor.getAllContent(pageContent);
  }

  /**
   * Create an action plan from natural language instruction
   */
  async createActionPlan(instruction: string, context: TaskContext, pageState?: PageState): Promise<ActionPlan> {
    try {
      const currentPageState: PageState = pageState || this.createDefaultPageState(context);

      const parsedInstruction = await this.parseInstructionWithAI(instruction, currentPageState, context);

      return this.planBuilder.buildPlan(
        instruction,
        parsedInstruction.steps,
        parsedInstruction.reasoning,
        context,
        pageState
      );
    } catch (error) {
      console.error('Failed to create action plan:', error);
      throw new Error(`Failed to parse instruction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a default page state when none is provided
   */
  private createDefaultPageState(context: TaskContext): PageState {
    return {
      url: context.url || 'about:blank',
      title: context.pageTitle || 'Unknown Page',
      content: '',
      screenshot: Buffer.from(''),
      timestamp: Date.now(),
      viewport: { width: 1920, height: 1080 },
      elements: []
    };
  }

  /**
   * Parse instruction using AI with current page context
   */
  private async parseInstructionWithAI(instruction: string, pageState: PageState, context: TaskContext): Promise<ParsedInstruction> {
    const allContent = this.contentExtractor.getAllContent(pageState.content || '');

    const executionContext = context.executionContextSummary || this.prepareExecutionContext(context);

    const userPrompt = this.promptTemplate.render('instruction-to-steps', {
      instruction: instruction,
      pageUrl: pageState.url,
      pageTitle: pageState.title,
      pageContent: allContent.structure,
      formElements: allContent.forms,
      interactiveElements: allContent.interactions,
      executionContext: executionContext
    });

    try {
      const response = await this.aiService.generateStructuredResponse(userPrompt, '');
      const parsed = JSON.parse(response);
      return this.responseParser.convertStructuredResponse(parsed);

    } catch (error) {
      console.error('❌ Structured output failed, falling back to text parsing:', error);
      // Fallback to text parsing
      return this.parseInstructionWithTextFallback(instruction, userPrompt);
    }
  }

  /**
   * Fallback method using text generation when structured output fails
   */
  private async parseInstructionWithTextFallback(instruction: string, userPrompt: string): Promise<ParsedInstruction> {
    try {
      const response = await this.aiService.generateTextWithRetries(userPrompt, '');
      return this.responseParser.parseTextResponse(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get valid JSON from AI: ${errorMessage}`);
    }
  }

  /**
   * Prepare execution context from task history for AI planning
   */
  private prepareExecutionContext(context: TaskContext): string {
    if (context.executionContextSummary) {
      try {
        const parsedContext = JSON.parse(context.executionContextSummary);
        if (parsedContext.extractedData && parsedContext.extractedData.length > 0) {
          const contextLines: string[] = [];
          contextLines.push("=== EXECUTION CONTEXT ===");
          contextLines.push("Previously extracted data:");
          contextLines.push("");

          parsedContext.extractedData.forEach((item: any, index: number) => {
            contextLines.push(`Extracted Data ${index + 1}:`);
            contextLines.push(`- Description: ${item.description}`);
            contextLines.push(`- Data: ${JSON.stringify(item.data, null, 2)}`);
            contextLines.push(`- Timestamp: ${item.timestamp}`);
            contextLines.push("");
          });

          if (parsedContext.recentSteps && parsedContext.recentSteps.length > 0) {
            contextLines.push("Recent steps executed:");
            parsedContext.recentSteps.forEach((step: any, index: number) => {
              contextLines.push(`${index + 1}. ${step.type.toUpperCase()}: ${step.description} (${step.success ? 'SUCCESS' : 'FAILED'})`);
            });
          }

          return contextLines.join("\n");
        }
      } catch (error) {
        console.warn('Failed to parse execution context summary:', error);
      }
    }

    if (!context.history || context.history.length === 0) {
      return "No previous execution context available.";
    }

    const recentSteps = context.history.slice(-5); // Get last 5 steps
    const contextLines: string[] = [];

    contextLines.push("=== EXECUTION CONTEXT ===");
    contextLines.push(`Previous ${recentSteps.length} step(s) executed:`);
    contextLines.push("");

    // Include extracted data if available
    const extractedData: string[] = [];

    recentSteps.forEach((step, index) => {
      const stepNumber = context.history.length - recentSteps.length + index + 1;
      contextLines.push(`Step ${stepNumber}:`);
      contextLines.push(`  Type: ${step.type}`);
      contextLines.push(`  Description: ${step.description}`);

      if (step.target?.selector) {
        contextLines.push(`  Selector: ${step.target.selector}`);
      }

      if (step.value) {
        contextLines.push(`  Value: ${step.value}`);
      }


      contextLines.push("");
    });

    const successfulSelectors = recentSteps
      .filter(step => step.target?.selector)
      .map(step => step.target!.selector);

    if (successfulSelectors.length > 0) {
      contextLines.push("Successful selector patterns to consider:");
      successfulSelectors.forEach(selector => {
        contextLines.push(`  - ${selector}`);
      });
      contextLines.push("");
    }

    contextLines.push("Use this context to inform better selector choices and action planning.");
    contextLines.push("=========================");

    return contextLines.join('\n');
  }

  /**
   * Adapt an existing plan based on current page state using AI
   */
  async adaptPlan(currentPlan: ActionPlan, currentState: PageState): Promise<ActionPlan> {
    try {
      const systemPrompt = await this.promptTemplate.render('plan-adaptation', {});

      const adaptPrompt = this.promptTemplate.render('plan-adaptation-analysis', {
        currentPlan: JSON.stringify(currentPlan.steps, null, 2),
        url: currentState.url,
        title: currentState.title,
        pageContent: currentState.content || 'No content available'
      });

      const response = await this.aiService.generateTextWithRetries(adaptPrompt, systemPrompt);
      const adaptedInstruction = this.responseParser.parseTextResponse(response);

      return this.planBuilder.buildAdaptedPlan(
        currentPlan,
        adaptedInstruction.steps,
        adaptedInstruction.reasoning
      );
    } catch (error) {
      console.error('Failed to adapt plan:', error);
      return currentPlan;
    }
  }
}
