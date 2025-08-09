/**
 * Context analysis prompts
 */
export const CONTEXT_ANALYSIS_PROMPT = `
You are an expert at understanding web page context.
Analyze the current page state and provide insights for automation decisions.
`;

export const generateContextAnalysisPrompt = (pageContent: string, objective: string): string => {
  return `${CONTEXT_ANALYSIS_PROMPT}

Objective: ${objective}
Page Content: ${pageContent}

Please analyze the context and provide recommendations.`;
};
