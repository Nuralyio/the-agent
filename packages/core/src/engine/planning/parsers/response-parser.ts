import { GlobalPlanInstruction } from '../types/planning.types';

/**
 * Parses AI responses for execution planning
 */
export class ResponseParser {
  /**
   * Parse global plan response from AI
   */
  parseGlobalPlanResponse(responseContent: string, fallbackInstruction: string): GlobalPlanInstruction {
    try {
      const cleanContent = this.cleanJsonResponse(responseContent);
      const parsed = JSON.parse(cleanContent);

      if (!this.isValidGlobalPlan(parsed)) {
        throw new Error('Invalid global plan structure');
      }

      return {
        subObjectives: parsed.subObjectives,
        planningStrategy: parsed.planningStrategy || 'sequential',
        reasoning: parsed.reasoning || 'AI-generated global plan'
      };

    } catch (error) {
      console.error('Failed to parse global plan:', error);
      return this.createFallbackPlan(fallbackInstruction);
    }
  }

  /**
   * Clean JSON response by removing code block markers
   */
  private cleanJsonResponse(content: string): string {
    let cleanContent = content.trim();

    // Remove code block markers
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.substring(7);
    }
    if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.substring(3);
    }
    if (cleanContent.endsWith('```')) {
      cleanContent = cleanContent.substring(0, cleanContent.length - 3);
    }

    return cleanContent.trim();
  }

  /**
   * Validate global plan structure
   */
  private isValidGlobalPlan(parsed: any): boolean {
    if (!parsed || typeof parsed !== 'object') {
      return false;
    }

    if (!parsed.subObjectives || !Array.isArray(parsed.subObjectives)) {
      return false;
    }

    if (parsed.subObjectives.length === 0) {
      return false;
    }

    // Ensure all sub-objectives are strings
    if (!parsed.subObjectives.every((obj: any) => typeof obj === 'string')) {
      return false;
    }

    return true;
  }

  /**
   * Create fallback plan when parsing fails
   */
  private createFallbackPlan(instruction: string): GlobalPlanInstruction {
    return {
      subObjectives: [instruction],
      planningStrategy: 'sequential',
      reasoning: 'Fallback: single objective due to parsing error'
    };
  }

}
