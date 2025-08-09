import { AIEngine } from '../../ai/ai-engine';
import { ActionPlan, ActionStep, ActionType, PageState, TaskContext } from '../types';
import * as crypto from 'crypto';

interface ParsedInstruction {
  steps: ActionStep[];
  reasoning: string;
}

/**
 * ActionPlanner - Converts natural language instructions into actionable steps using AI
 */
export class ActionPlanner {
  private aiEngine: AIEngine;

  constructor(aiEngine: AIEngine) {
    this.aiEngine = aiEngine;
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

    const systemPrompt = `You are a browser automation expert. Your job is to convert natural language instructions into a sequence of browser automation actions.

Available action types:
- NAVIGATE: Navigate to a URL
- CLICK: Click on an element (buttons, radio buttons, checkboxes, links)
- TYPE: Type text into input fields, textareas, and time inputs
- FILL: Fill form fields with data (use sparingly, prefer TYPE)
- SCROLL: Scroll the page (up, down, or to element)
- WAIT: Wait for a specified time or element to appear
- EXTRACT: Extract text content from an element
- SCREENSHOT: Take a screenshot (optional filename in value)

Current page state:
- URL: ${pageState.url}
- Title: ${pageState.title}

Current page content (for selector identification):
${pageContent}

IMPORTANT RULES:
1. ONLY respond with valid JSON - no markdown, no explanations, no comments
2. For CLICK actions, use ACTUAL CSS selectors from the page content above
3. Look at the page content to find the best selectors for elements
4. For radio buttons: use CLICK on input[value="desired_value"]
5. For checkboxes: use CLICK on input[value="desired_value"]
6. For select dropdowns: NOT SUPPORTED - ask user to use simpler form elements
7. For form filling, prefer individual TYPE actions over FILL to avoid JSON nesting issues
8. Each step MUST have valid "type" and "description" fields - this is mandatory
9. Always close JSON properly with closing braces - ensure the "reasoning" field ends with quotes
10. NEVER use SELECT action type - it's not supported
11. NEVER use pseudo-selectors like ::checked - they are not supported

Required JSON structure:
{
  "steps": [
    {
      "type": "ACTION_TYPE",
      "target": { "selector": "css-selector", "description": "human description" },
      "value": "value if needed",
      "description": "what this step does - REQUIRED FOR ALL STEPS"
    }
  ],
  "reasoning": "brief explanation of the approach"
}

Example for "click on login button":
{
  "steps": [
    {
      "type": "CLICK",
      "target": { "selector": "button[type='submit']", "description": "login button" },
      "description": "Click the login button"
    }
  ],
  "reasoning": "Looking for submit button which is commonly used for login"
}

Example for "fill out contact form":
{
  "steps": [
    {
      "type": "TYPE",
      "target": { "selector": "input[name='name']", "description": "name input field" },
      "value": "John Doe",
      "description": "Fill the name field"
    },
    {
      "type": "TYPE",
      "target": { "selector": "input[name='email']", "description": "email input field" },
      "value": "john@example.com",
      "description": "Fill the email field"
    }
  ],
  "reasoning": "Breaking down form filling into individual TYPE actions for each field"
}

Example for "select radio button for medium size":
{
  "steps": [
    {
      "type": "CLICK",
      "target": { "selector": "input[value='medium']", "description": "medium size radio button" },
      "description": "Select medium size option"
    }
  ],
  "reasoning": "Click on the radio button with value 'medium'"
}

Example for "select checkboxes for bacon and cheese":
{
  "steps": [
    {
      "type": "CLICK",
      "target": { "selector": "input[value='bacon']", "description": "bacon checkbox" },
      "description": "Select bacon topping"
    },
    {
      "type": "CLICK",
      "target": { "selector": "input[value='cheese']", "description": "cheese checkbox" },
      "description": "Select cheese topping"
    }
  ],
  "reasoning": "Click on each checkbox to select toppings"
}

Example for "navigate to aymen.co":
{
  "steps": [
    {
      "type": "NAVIGATE",
      "value": "https://aymen.co",
      "description": "Navigate to aymen.co website"
    }
  ],
  "reasoning": "Direct navigation to the specified domain"
}

Example for "take a screenshot":
{
  "steps": [
    {
      "type": "SCREENSHOT",
      "value": "",
      "description": "Take a screenshot of the current page"
    }
  ],
  "reasoning": "Capturing current page state"
}`;

    const prompt = `Instruction: "${instruction}"

Convert this to browser automation steps. Respond with ONLY valid JSON, no other text.`;

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${maxRetries} to get valid JSON from LLM`);

        const response = await this.aiEngine.generateText(prompt, systemPrompt);

        console.log(`📊 Response stats: ${response.content.length} chars`);

        // Try to parse the response - let JSON.parse detect any issues
        const result = this.parseAIResponse(response.content);
        console.log(`✅ Successfully got valid JSON on attempt ${attempt}`);
        return result;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`⚠️ Attempt ${attempt} failed: ${lastError.message}`);

        if (attempt === maxRetries) {
          console.error(`❌ All ${maxRetries} attempts failed to get valid JSON`);
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
    const trimmed = response.trim();

    try {
      console.log(`🔍 Parsing AI response: ${trimmed.length} chars`);

      // Parse JSON directly - let it detect all formatting issues
      let parsed;
      try {
        parsed = JSON.parse(trimmed);
      } catch (parseError) {
        const errorMsg = parseError instanceof Error ? parseError.message : 'Unknown parse error';
        console.error('❌ JSON parse error:', errorMsg);
        console.error('📝 Response preview:', trimmed.substring(0, 200) + '...');
        throw new Error(`JSON parsing failed: ${errorMsg}`);
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
      const adaptPrompt = `The current action plan failed or needs adjustment.

Current plan:
${JSON.stringify(currentPlan.steps, null, 2)}

Current page state:
- URL: ${currentState.url}
- Title: ${currentState.title}

Please analyze the situation and provide an updated action plan that should work better with the current page state.`;

      const response = await this.aiEngine.generateText(adaptPrompt);
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
