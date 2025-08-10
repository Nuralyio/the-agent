/**
 * Action planning prompts
 */
export const ACTION_PLANNING_PROMPT = `
You are an expert browser automation assistant. 
Your task is to create a step-by-step action plan for the given instruction.
`;

export const generateActionPlanPrompt = (instruction: string, context?: string): string => {
  return `${ACTION_PLANNING_PROMPT}

Instruction: ${instruction}
${context ? `Context: ${context}` : ''}

Please provide a detailed action plan.`;
};
