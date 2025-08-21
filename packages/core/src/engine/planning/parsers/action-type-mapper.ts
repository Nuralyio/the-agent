import { ActionType } from '../types/types';

/**
 * Maps between different action type representations
 */
export class ActionTypeMapper {
  private readonly typeMap: Record<string, ActionType>;

  constructor() {
    this.typeMap = {
      'NAVIGATE': ActionType.NAVIGATE,
      'CLICK': ActionType.CLICK,
      'TYPE': ActionType.TYPE,
      'FILL': ActionType.FILL,
      'SCROLL': ActionType.SCROLL,
      'WAIT': ActionType.WAIT,
      'EXTRACT': ActionType.EXTRACT,
      'VERIFY': ActionType.VERIFY,
      'SCREENSHOT': ActionType.SCREENSHOT,
    };
  }

  /**
   * Map from schema action type to internal ActionType
   */
  mapToInternalType(type: string): ActionType {
    return this.typeMap[type] || ActionType.EXTRACT;
  }

  /**
   * Map from AI response action type to internal ActionType
   */
  mapFromAIResponse(type: string): ActionType | null {
    const mapped = this.typeMap[type.toUpperCase()];
    return mapped || null;
  }

}
