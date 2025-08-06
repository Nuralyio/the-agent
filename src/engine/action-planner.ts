import { AIEngine } from '../ai/ai-engine';
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
        url: context.url,
        title: context.pageTitle,
        content: '',
        screenshot: Buffer.from(''),
        timestamp: new Date(),
        viewport: { width: 1920, height: 1080 }
      };

      const parsedInstruction = await this.parseInstructionWithAI(instruction, currentPageState);

      return {
        steps: parsedInstruction.steps,
        context: {
          url: context.url,
          pageTitle: context.pageTitle,
          currentStep: 0,
          totalSteps: parsedInstruction.steps.length,
          variables: {}
        },
        expectedOutcome: parsedInstruction.reasoning
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
    const pageContent = this.extractRelevantPageContent(pageState.content);
    
    const systemPrompt = `You are a browser automation expert. Your job is to convert natural language instructions into a sequence of browser automation actions.

Available action types:
- NAVIGATE: Navigate to a URL
- CLICK: Click on an element (provide valid CSS selector)
- TYPE: Type text into an input field (provide CSS selector and text)
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
4. For NAVIGATE actions, provide the URL in "value" field with full protocol (https://)
5. For SCREENSHOT actions, provide filename in "value" field
6. Each step must have valid "type" and "description"
7. Always close JSON properly with closing braces

Required JSON structure:
{
  "steps": [
    {
      "type": "ACTION_TYPE",
      "target": { "selector": "css-selector", "description": "human description" },
      "value": "value if needed",
      "description": "what this step does"
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
      "value": "screenshot.png",
      "description": "Take a screenshot of the current page"
    }
  ],
  "reasoning": "Capturing current page state"
}`;

    const prompt = `Instruction: "${instruction}"

Convert this to browser automation steps. Respond with ONLY valid JSON, no other text.`;

    try {
      const response = await this.aiEngine.generateText(prompt, systemPrompt);
      return this.parseAIResponse(response.content);
    } catch (error) {
      console.error('AI parsing failed:', error);
      throw new Error(`AI parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse AI response into structured format with robust error handling
   */
  private parseAIResponse(response: string): ParsedInstruction {
    try {
      console.log('🔍 Raw AI response:', response.substring(0, 500) + (response.length > 500 ? '...' : ''));

      // Parse JSON directly without cleaning for Ollama
      let parsed;
      try {
        parsed = JSON.parse(response.trim());
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        console.error('🔤 Failed to parse JSON:', response);
        throw new Error(`Failed to parse JSON from Ollama: ${parseError}`);
      }

      // Step 3: Validate structure
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Parsed response is not an object');
      }

      if (!parsed.steps || !Array.isArray(parsed.steps)) {
        throw new Error('Invalid response format: missing or invalid steps array');
      }

      // Step 4: Validate and normalize steps
      const steps: ActionStep[] = parsed.steps.map((step: any, index: number) => {
        if (!step || typeof step !== 'object') {
          throw new Error(`Invalid step ${index}: not an object`);
        }

        if (!step.type || !step.description) {
          throw new Error(`Invalid step ${index}: missing type or description`);
        }

        // Map AI response strings to ActionType enum values
        const typeMapping: { [key: string]: ActionType } = {
          'NAVIGATE': ActionType.NAVIGATE,
          'CLICK': ActionType.CLICK,
          'TYPE': ActionType.TYPE,
          'SCROLL': ActionType.SCROLL,
          'WAIT': ActionType.WAIT,
          'EXTRACT': ActionType.EXTRACT,
          'VERIFY': ActionType.VERIFY,
          'SCREENSHOT': ActionType.SCREENSHOT,
          // Also handle lowercase variants
          'navigate': ActionType.NAVIGATE,
          'click': ActionType.CLICK,
          'type': ActionType.TYPE,
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
          type: mappedType,
          description: step.description
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
      console.error('❌ Failed to parse AI response:', error);
      console.error('📝 Original response:', response);
      throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        steps: adaptedInstruction.steps,
        context: {
          ...currentPlan.context,
          totalSteps: adaptedInstruction.steps.length
        },
        expectedOutcome: adaptedInstruction.reasoning
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
      
      // Extract text content and important attributes
      const relevantTags = [
        'a', 'button', 'input', 'select', 'textarea', 'form', 
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'span',
        'nav', 'header', 'footer', 'main', 'section', 'article'
      ];
      
      let extractedContent = '';
      
      // Simple regex-based extraction (could be improved with proper HTML parser)
      for (const tag of relevantTags) {
        const regex = new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`, 'gi');
        const matches = cleanHtml.match(regex);
        if (matches) {
          matches.slice(0, 10).forEach(match => { // Limit to avoid too much content
            extractedContent += match + '\n';
          });
        }
      }

      // Limit content length to avoid overwhelming the AI
      if (extractedContent.length > 3000) {
        extractedContent = extractedContent.substring(0, 3000) + '...';
      }

      return extractedContent || 'Limited page content available';
    } catch (error) {
      console.error('Error extracting page content:', error);
      return 'Error extracting page content';
    }
  }
}
