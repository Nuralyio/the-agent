import { AIEngine } from '../../../../ai/ai-engine';
import { PromptTemplate } from '../../../../prompt-template';
import { HierarchicalResponseParser } from '../parsers/response-parser';
import { GlobalPlanConfig, GlobalPlanInstruction } from '../types/hierarchical-planning.types';

/**
 * Service for creating global plans from complex instructions
 */
export class GlobalPlanService {
  private aiEngine: AIEngine;
  private promptTemplate: PromptTemplate;
  private responseParser: HierarchicalResponseParser;

  constructor(aiEngine: AIEngine) {
    this.aiEngine = aiEngine;
    this.promptTemplate = new PromptTemplate();
    this.responseParser = new HierarchicalResponseParser();
  }

  /**
   * Create global plan by breaking down instruction into sub-objectives
   */
  async createGlobalPlan(config: GlobalPlanConfig): Promise<GlobalPlanInstruction> {
    const { instruction, context, pageState } = config;

    const systemPrompt = this.promptTemplate.render('hierarchical-planning', {
      pageUrl: pageState?.url || context.url || 'about:blank',
      pageTitle: pageState?.title || context.pageTitle || 'Unknown Page',
    });

    const userPrompt = this.buildGlobalPlanPrompt(instruction);

    console.log(`📋 Creating global plan for: "${instruction}"`);

    const response = await this.aiEngine.generateText(userPrompt, systemPrompt);

    return this.responseParser.parseGlobalPlanResponse(response.content, instruction);
  }

  /**
   * Build the user prompt for global planning
   */
  private buildGlobalPlanPrompt(instruction: string): string {
    return `Break down this complex instruction into logical sub-objectives:

"${instruction}"

IMPORTANT: You must create AT LEAST 2 separate sub-objectives, preferably 3-6 for complex tasks.

Analyze the instruction and create a high-level plan with clear sub-objectives. Each sub-objective should be:
1. A logical step towards the main goal
2. Specific enough to be executed independently
3. In the correct order for the overall task
4. Break navigation, authentication, and main actions into separate objectives

For example, if the instruction is "Navigate to https://example.com and create a user account",
the sub-objectives would be:
1. "Navigate to https://example.com"
2. "Find and access the registration/sign-up page"
3. "Fill out the registration form with user details"
4. "Submit the registration and verify account creation"

For the given instruction about OrangeHRM and creating a candidate, you should break it down into separate objectives for:
- Navigation to the website
- Authentication/login (if needed)
- Finding the candidate management section
- Creating the new candidate
- Verification of creation

Respond with ONLY valid JSON in this format:
{
  "subObjectives": ["sub-objective 1", "sub-objective 2", "sub-objective 3", ...],
  "planningStrategy": "sequential|parallel|conditional",
  "reasoning": "Brief explanation of the approach"
}`;
  }

  /**
   * Validate global plan configuration
   */
  validateConfig(config: GlobalPlanConfig): void {
    if (!config.instruction || config.instruction.trim().length === 0) {
      throw new Error('Instruction is required for global plan creation');
    }

    if (!config.context) {
      throw new Error('Task context is required for global plan creation');
    }
  }
}
