import * as crypto from 'crypto';
import { ActionPlanInput } from '../../../types/action-schemas';
import { ActionStep } from '../types/types';
import { ActionTypeMapper } from './action-type-mapper';

export interface ParsedInstruction {
  steps: ActionStep[];
  reasoning: string;
}

/**
 * Handles parsing and validation of AI responses for action planning
 */
export class AIResponseParser {
  private actionTypeMapper: ActionTypeMapper;

  constructor() {
    this.actionTypeMapper = new ActionTypeMapper();
  }

  /**
   * Convert AI response to internal format
   */
  convertStructuredResponse(response: ActionPlanInput): ParsedInstruction {
    const steps: ActionStep[] = response.steps.map(step => {
      const mappedType = this.actionTypeMapper.mapToInternalType(step.type);

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
   * Parse AI text response into structured format with robust error handling
   */
  parseTextResponse(response: string): ParsedInstruction {
    const cleanedResponse = this.cleanResponse(response);

    try {
      console.log(`🔍 Parsing AI response: ${cleanedResponse.length} chars`);

      const parsed = this.parseJSON(cleanedResponse);
      this.validateResponseStructure(parsed);

      const steps = this.parseSteps(parsed.steps);

      const result = {
        steps,
        reasoning: parsed.reasoning || 'AI-generated action plan'
      };

      console.log('✅ Successfully parsed AI response:', result.steps.length, 'steps');
      return result;

    } catch (error) {
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * Clean the response by removing Markdown and fixing common issues
   */
  private cleanResponse(response: string): string {
    let trimmed = response.trim();

    // Strip Markdown code blocks if present
    if (trimmed.startsWith('```json')) {
      trimmed = trimmed.replace(/^```json[ \t\r\n]*/, '').replace(/[ \t\r\n]*```$/, '');
      console.log('🔧 Removed markdown code block wrapper');
    } else if (trimmed.startsWith('```')) {
      trimmed = trimmed.replace(/^```[ \t\r\n]*/, '').replace(/[ \t\r\n]*```$/, '');
      console.log('🔧 Removed generic code block wrapper');
    }

    return this.fixCommonJSONIssues(trimmed);
  }

  /**
   * Fix common JSON formatting issues
   */
  private fixCommonJSONIssues(jsonString: string): string {
    if (jsonString.includes('"reasoning":') && !jsonString.endsWith('}')) {
      const reasoningMatch = jsonString.match(/"reasoning":[ \t]*"([^"]*)"?$/);
      if (reasoningMatch && !reasoningMatch[1].endsWith('"')) {
        jsonString = jsonString.replace(/"reasoning":[ \t]*"([^"]*)"?$/, '"reasoning": "$1"}');
      } else if (jsonString.includes('"reasoning":') && !jsonString.includes('}', jsonString.lastIndexOf('"reasoning":'))) {
        jsonString += '}';
      }
    }

    return jsonString;
  }

  /**
   * Parse JSON with error recovery
   */
  private parseJSON(jsonString: string): any {
    try {
      return JSON.parse(jsonString);
    } catch (parseError) {
      const errorMsg = parseError instanceof Error ? parseError.message : 'Unknown parse error';
      console.error('❌ JSON parse error:', errorMsg);
      console.error('📝 Response preview:', jsonString.substring(0, 200) + '...');

      if (errorMsg.includes('Expected') && errorMsg.includes('after property value')) {
        const fixedJson = jsonString.replace(/,[ \t]*$/, '').replace(/([^}])$/, '$1}');
        return JSON.parse(fixedJson);
      }

      throw new Error(`JSON parsing failed: ${errorMsg}`);
    }
  }

  /**
   * Validate the structure of the parsed response
   */
  private validateResponseStructure(parsed: any): void {
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Response is not a valid JSON object');
    }

    if (!parsed.steps || !Array.isArray(parsed.steps)) {
      throw new Error('Missing required "steps" array in response');
    }

    if (parsed.steps.length === 0) {
      throw new Error('Steps array is empty');
    }
  }

  /**
   * Parse and validate individual steps
   */
  private parseSteps(steps: any[]): ActionStep[] {
    return steps.map((step: any, index: number) => {
      this.validateStep(step, index);
      return this.convertStep(step, index);
    });
  }

  /**
   * Validate an individual step
   */
  private validateStep(step: any, index: number): void {
    if (!step || typeof step !== 'object') {
      throw new Error(`Step ${index + 1} is not a valid object`);
    }

    if (!step.type) {
      throw new Error(`Step ${index + 1} missing required "type" field`);
    }

    const description = step.description || (step.target && step.target.description);
    if (!description) {
      throw new Error(`Step ${index + 1} missing description`);
    }
  }

  /**
   * Convert a raw step to ActionStep format
   */
  private convertStep(step: any, index: number): ActionStep {
    const mappedType = this.actionTypeMapper.mapFromAIResponse(step.type);
    if (!mappedType) {
      throw new Error(`Invalid step ${index + 1}: unsupported action type "${step.type}"`);
    }

    const description = step.description || (step.target && step.target.description);

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
  }
}
