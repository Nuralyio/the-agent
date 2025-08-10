import { ElementInfo } from '../../engine/types';

/**
 * Element analysis prompts
 */
export const ELEMENT_ANALYSIS_PROMPT = `
You are an expert at analyzing web page elements.
Analyze the provided elements and determine the best action targets.
`;

export const generateElementAnalysisPrompt = (elements: ElementInfo[], task: string): string => {
  return `${ELEMENT_ANALYSIS_PROMPT}

Task: ${task}
Elements: ${JSON.stringify(elements, null, 2)}

Please analyze and recommend the best elements to interact with.`;
};
