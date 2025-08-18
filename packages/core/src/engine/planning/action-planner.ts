import { AIEngine } from '../ai-engine';
import { PromptTemplate } from '../../prompt-template';
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
   * Create an action plan from natural language instruction
   */
  async createActionPlan(instruction: string, context: TaskContext, pageState?: PageState): Promise<ActionPlan> {
    try {
      // Use provided pageState or create a minimal one
      const currentPageState: PageState = pageState || this.createDefaultPageState(context);

      const parsedInstruction = await this.parseInstructionWithAI(instruction, currentPageState);

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
   * Parse instruction using AI with improved structured output handling
   */
  private async parseInstructionWithAI(instruction: string, pageState: PageState): Promise<ParsedInstruction> {
    // Extract relevant content from page for better selector identification
    const pageContent = this.contentExtractor.extractRelevantContent(pageState.content || '');

    // Extract structured form and interactive elements
    const structuredContent = this.contentExtractor.extractStructuredContent(pageState.content || '');

    // Combine form fields and select elements into formElements
    const formElements = {
      formFields: structuredContent.formFields,
      selectElements: structuredContent.selectElements
    };

    const systemPrompt = this.promptTemplate.render('action-planning', {
      pageUrl: pageState.url,
      pageTitle: pageState.title,
      pageContent: pageContent,
      formElements: JSON.stringify(formElements, null, 2),
      interactiveElements: JSON.stringify(structuredContent.interactableElements, null, 2)
    });

    const userPrompt = `Instruction: "${instruction}"

Convert this to browser automation steps following the expected format.`;

    try {
      // Try structured output first
      const response = await this.aiService.generateStructuredResponse(userPrompt, systemPrompt);
      const parsed = JSON.parse(response);
      return this.responseParser.convertStructuredResponse(parsed);

    } catch (error) {
      console.error('❌ Structured output failed, falling back to text parsing:', error);
      // Fallback to text parsing
      return this.parseInstructionWithTextFallback(instruction, systemPrompt);
    }
  }

  /**
   * Fallback method using text generation when structured output fails
   */
  private async parseInstructionWithTextFallback(instruction: string, systemPrompt: string): Promise<ParsedInstruction> {
    const userPrompt = `Instruction: "${instruction}"

Convert this to browser automation steps. Respond with ONLY valid JSON, no other text.`;

    try {
      const response = await this.aiService.generateTextWithRetries(userPrompt, systemPrompt);
      return this.responseParser.parseTextResponse(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get valid JSON from AI: ${errorMessage}`);
    }
  }

  /**
   * Adapt an existing plan based on current page state using AI
   */
  async adaptPlan(currentPlan: ActionPlan, currentState: PageState): Promise<ActionPlan> {
    try {
      const systemPrompt = this.promptTemplate.render('plan-adaptation', {});

      const adaptPrompt = `The current action plan failed or needs adjustment.

Current plan:
${JSON.stringify(currentPlan.steps, null, 2)}

Current page state:
- URL: ${currentState.url}
- Title: ${currentState.title}

Current page content (for accurate selector refinement):
${currentState.content || 'No content available'}

Please analyze the situation and the actual page HTML content above to provide an updated action plan with correct selectors based on what's actually on the page. Respond with ONLY valid JSON, no other text.`;

      const response = await this.aiService.generateTextWithRetries(adaptPrompt, systemPrompt);
      const adaptedInstruction = this.responseParser.parseTextResponse(response);

      return this.planBuilder.buildAdaptedPlan(
        currentPlan,
        adaptedInstruction.steps,
        adaptedInstruction.reasoning
      );
    } catch (error) {
      console.error('Failed to adapt plan:', error);
      // Return original plan as fallback
      return currentPlan;
    }
  }
}
