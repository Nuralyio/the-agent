import * as crypto from 'crypto';
import { AIEngine } from '../../ai/ai-engine';
import { PromptTemplate } from '../../prompt-template';
import { ActionPlanInput } from '../../types/action-schemas';
import { ActionPlan, ActionStep, ActionType, PageState, TaskContext } from '../types';

interface ParsedInstruction {
  steps: ActionStep[];
  reasoning: string;
}

/**
 * ActionPlanner - Converts natural language instructions into actionable steps using AI
 */
export class ActionPlanner {
  private aiEngine: AIEngine;
  private promptTemplate: PromptTemplate;

  constructor(aiEngine: AIEngine) {
    this.aiEngine = aiEngine;
    this.promptTemplate = new PromptTemplate();
  }

  /**
   * Create an action plan from natural language instruction
   */
  async createActionPlan(instruction: string, context: TaskContext, pageState?: PageState): Promise<ActionPlan> {
    try {
      // Use provided pageState or create a minimal one
      const currentPageState: PageState = pageState || {
        url: context.url || 'about:blank',
        title: context.pageTitle || 'Unknown Page',
        content: '',
        screenshot: Buffer.from(''),
        timestamp: Date.now(),
        viewport: { width: 1920, height: 1080 },
        elements: []
      };

      const parsedInstruction = await this.parseInstructionWithAI(instruction, currentPageState);

      return {
        id: crypto.randomUUID(),
        objective: instruction,
        steps: parsedInstruction.steps,
        estimatedDuration: parsedInstruction.steps.length * 1000, // Rough estimate
        dependencies: [],
        priority: 1,
        context: {
          url: context.url,
          pageTitle: context.pageTitle,
          currentStep: 0,
          totalSteps: parsedInstruction.steps.length,
          variables: {}
        },
        metadata: {
          reasoning: parsedInstruction.reasoning
        }
      };
    } catch (error) {
      console.error('Failed to create action plan:', error);
      throw new Error(`Failed to parse instruction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse instruction using AI with improved structured output handling
   */
  private async parseInstructionWithAI(instruction: string, pageState: PageState): Promise<ParsedInstruction> {
    // Extract relevant content from page for better selector identification
    const pageContent = this.extractRelevantPageContent(pageState.content || '');

    const systemPrompt = this.promptTemplate.render('action-planning', {
      pageUrl: pageState.url,
      pageTitle: pageState.title,
      pageContent: pageContent
    });


    const userPrompt = `Instruction: "${instruction}"

Convert this to browser automation steps following the expected format.`;

    try {
      console.log(`🔄 Using structured output for better reliability`);

      // Use the existing generateStructuredJSON method
      const response = await this.aiEngine.generateStructuredJSON(userPrompt, systemPrompt);

      console.log(`✅ Successfully got structured response`);

      // Parse the JSON content from the response
      const parsed = JSON.parse(response.content);

      // Convert to our internal format
      return this.convertToInternalFormat(parsed);

    } catch (error) {
      console.error('❌ Structured output failed, falling back to text parsing:', error);

      // Fallback to the old method if structured output fails
      return this.parseInstructionWithTextFallback(instruction, systemPrompt);
    }
  }

  /**
   * Convert AI response to internal format
   */
  private convertToInternalFormat(response: ActionPlanInput): ParsedInstruction {
    const steps: ActionStep[] = response.steps.map(step => {
      // Map action types to our internal format
      const mappedType = this.mapActionType(step.type);

      const actionStep: ActionStep = {
        id: crypto.randomUUID(),
        type: mappedType,
        description: step.description
      };

      if (step.target) {
        actionStep.target = {
          selector: step.target.selector,
          description: step.target.description
        };
      }

      if (step.value !== undefined && step.value !== null) {
        actionStep.value = step.value;
      }

      return actionStep;
    });

    return {
      steps,
      reasoning: response.reasoning
    };
  }

  /**
   * Map schema action types to internal action types
   */
  private mapActionType(type: string): ActionType {
    const typeMap: Record<string, ActionType> = {
      'NAVIGATE': ActionType.NAVIGATE,
      'CLICK': ActionType.CLICK,
      'TYPE': ActionType.TYPE,
      'FILL': ActionType.FILL,
      'SCROLL': ActionType.SCROLL,
      'WAIT': ActionType.WAIT,
      'EXTRACT': ActionType.EXTRACT,
      'SCREENSHOT': ActionType.SCREENSHOT
    };

    return typeMap[type] || ActionType.EXTRACT;
  }

  /**
   * Fallback method using text generation when structured output fails
   */
  private async parseInstructionWithTextFallback(instruction: string, systemPrompt: string): Promise<ParsedInstruction> {
    const userPrompt = `Instruction: "${instruction}"

Convert this to browser automation steps. Respond with ONLY valid JSON, no other text.`;

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Fallback attempt ${attempt}/${maxRetries} to get valid JSON from LLM`);

        const response = await this.aiEngine.generateText(userPrompt, systemPrompt);

        console.log(`📊 Response stats: ${response.content.length} chars`);

        // Try to parse the response - let JSON.parse detect any issues
        const result = this.parseAIResponse(response.content);
        console.log(`✅ Successfully got valid JSON on attempt ${attempt}`);
        return result;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`⚠️ Fallback attempt ${attempt} failed: ${lastError.message}`);

        if (attempt === maxRetries) {
          console.error(`❌ All ${maxRetries} fallback attempts failed to get valid JSON`);
          break;
        }

        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // If we get here, all attempts failed
    throw new Error(`Failed to get valid JSON after ${maxRetries} attempts. Last error: ${lastError?.message}`);
  }

  /**
   * Parse AI response into structured format with robust error handling
   */
  private parseAIResponse(response: string): ParsedInstruction {
    let trimmed = response.trim();

    try {
      console.log(`🔍 Parsing AI response: ${trimmed.length} chars`);

      // Strip markdown code blocks if present
      if (trimmed.startsWith('```json')) {
        trimmed = trimmed.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        console.log('🔧 Removed markdown code block wrapper');
      } else if (trimmed.startsWith('```')) {
        trimmed = trimmed.replace(/^```\s*/, '').replace(/\s*```$/, '');
        console.log('🔧 Removed generic code block wrapper');
      }

      // Try to fix common JSON issues before parsing
      let jsonString = trimmed;

      // Handle incomplete reasoning field by ensuring it ends properly
      if (jsonString.includes('"reasoning":') && !jsonString.endsWith('}')) {
        const reasoningMatch = jsonString.match(/"reasoning":\s*"([^"]*)"?$/);
        if (reasoningMatch && !reasoningMatch[1].endsWith('"')) {
          // Fix incomplete reasoning field
          jsonString = jsonString.replace(/"reasoning":\s*"([^"]*)"?$/, '"reasoning": "$1"}');
        } else if (jsonString.includes('"reasoning":') && !jsonString.includes('}', jsonString.lastIndexOf('"reasoning":'))) {
          // Add missing closing brace
          jsonString += '}';
        }
      }

      // Parse JSON directly - let it detect all formatting issues
      let parsed;
      try {
        parsed = JSON.parse(jsonString);
      } catch (parseError) {
        const errorMsg = parseError instanceof Error ? parseError.message : 'Unknown parse error';
        console.error('❌ JSON parse error:', errorMsg);
        console.error('📝 Response preview:', trimmed.substring(0, 200) + '...');

        // Try one more fix for malformed JSON at the end
        if (errorMsg.includes('Expected') && errorMsg.includes('after property value')) {
          const fixedJson = jsonString.replace(/,\s*$/, '').replace(/([^}])$/, '$1}');
          try {
            parsed = JSON.parse(fixedJson);
            console.log('✅ Fixed malformed JSON on second attempt');
          } catch (secondError) {
            throw new Error(`JSON parsing failed: ${errorMsg}`);
          }
        } else {
          throw new Error(`JSON parsing failed: ${errorMsg}`);
        }
      }

      // Validate structure
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Response is not a valid JSON object');
      }

      if (!parsed.steps || !Array.isArray(parsed.steps)) {
        throw new Error('Missing required "steps" array in response');
      }

      if (parsed.steps.length === 0) {
        throw new Error('Steps array is empty');
      }

      // Validate and normalize steps
      const steps: ActionStep[] = parsed.steps.map((step: any, index: number) => {
        if (!step || typeof step !== 'object') {
          throw new Error(`Step ${index + 1} is not a valid object`);
        }

        if (!step.type) {
          throw new Error(`Step ${index + 1} missing required "type" field`);
        }

        // Allow description to be either at the top level or in the target object
        const description = step.description || (step.target && step.target.description);
        if (!description) {
          throw new Error(`Invalid step ${index}: missing description`);
        }

        // Map AI response strings to ActionType enum values
        const typeMapping: { [key: string]: ActionType } = {
          'NAVIGATE': ActionType.NAVIGATE,
          'CLICK': ActionType.CLICK,
          'TYPE': ActionType.TYPE,
          'FILL': ActionType.FILL,
          'SCROLL': ActionType.SCROLL,
          'WAIT': ActionType.WAIT,
          'EXTRACT': ActionType.EXTRACT,
          'VERIFY': ActionType.VERIFY,
          'SCREENSHOT': ActionType.SCREENSHOT,
          // Also handle lowercase variants
          'navigate': ActionType.NAVIGATE,
          'click': ActionType.CLICK,
          'type': ActionType.TYPE,
          'fill': ActionType.FILL,
          'scroll': ActionType.SCROLL,
          'wait': ActionType.WAIT,
          'extract': ActionType.EXTRACT,
          'verify': ActionType.VERIFY,
          'screenshot': ActionType.SCREENSHOT
        };

        const mappedType = typeMapping[step.type] || typeMapping[step.type.toUpperCase()];
        if (!mappedType) {
          throw new Error(`Invalid step ${index}: unsupported action type "${step.type}"`);
        }

        const actionStep: ActionStep = {
          id: crypto.randomUUID(),
          type: mappedType,
          description: description
        };

        if (step.target) {
          actionStep.target = {
            selector: step.target.selector || step.target,
            description: step.target.description || step.description
          };
        }

        if (step.value !== undefined && step.value !== null) {
          actionStep.value = step.value;
        }

        return actionStep;
      });

      const result = {
        steps,
        reasoning: parsed.reasoning || 'AI-generated action plan'
      };

      console.log('✅ Successfully parsed AI response:', result.steps.length, 'steps');
      return result;

    } catch (error) {
      // Re-throw the error with its original message for retry mechanism
      throw error instanceof Error ? error : new Error(String(error));
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

      const response = await this.aiEngine.generateText(adaptPrompt, systemPrompt);
      const adaptedInstruction = await this.parseAIResponse(response.content);

      return {
        id: crypto.randomUUID(),
        objective: currentPlan.objective,
        steps: adaptedInstruction.steps,
        estimatedDuration: adaptedInstruction.steps.length * 1000,
        dependencies: currentPlan.dependencies || [],
        priority: currentPlan.priority || 1,
        context: {
          ...currentPlan.context,
          totalSteps: adaptedInstruction.steps.length
        },
        metadata: {
          reasoning: adaptedInstruction.reasoning,
          adaptedFrom: currentPlan.id
        }
      };
    } catch (error) {
      console.error('Failed to adapt plan:', error);
      // Return original plan as fallback
      return currentPlan;
    }
  }

  /**
   * Extract relevant content from page HTML for AI processing
   */
  private extractRelevantPageContent(html: string): string {
    if (!html) return 'No page content available';

    try {
      // Remove script and style tags
      let cleanHtml = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      cleanHtml = cleanHtml.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

      // Extract form-related content more effectively
      const formContent = this.extractFormElements(cleanHtml);

      return formContent;
    } catch (error) {
      console.error('Error extracting page content:', error);
      return 'Error extracting page content';
    }
  }

  private extractFormElements(html: string): string {
    let content = '';

    // Extract input fields with their attributes
    const inputMatches = html.match(/<input[^>]*>/gi) || [];
    inputMatches.forEach(input => {
      content += input + '\n';
    });

    // Extract textarea fields
    const textareaMatches = html.match(/<textarea[^>]*>.*?<\/textarea>/gi) || [];
    textareaMatches.forEach(textarea => {
      content += textarea + '\n';
    });

    // Extract buttons
    const buttonMatches = html.match(/<button[^>]*>.*?<\/button>/gi) || [];
    buttonMatches.forEach(button => {
      content += button + '\n';
    });

    // Extract form labels for context (important for radio buttons and checkboxes)
    const labelMatches = html.match(/<label[^>]*>.*?<\/label>/gi) || [];
    labelMatches.forEach(label => {
      content += label + '\n';
    });

    // Extract fieldsets for grouped form elements
    const fieldsetMatches = html.match(/<fieldset[^>]*>.*?<\/fieldset>/gis) || [];
    fieldsetMatches.forEach(fieldset => {
      // Extract just the legend and structure, not the full content to avoid duplication
      const legendMatch = fieldset.match(/<legend[^>]*>.*?<\/legend>/gi);
      if (legendMatch) {
        content += legendMatch[0] + '\n';
      }
    });

    return content || 'No form elements found';
  }
}
