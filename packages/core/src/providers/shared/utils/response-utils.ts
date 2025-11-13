import { AIResponse } from '../../../engine/ai-engine';

/**
 * Interface for usage metadata from LangChain responses
 */
interface UsageMetadata {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
}

/**
 * Interface for LangChain response
 */
export interface LangChainResponse {
  content: string | unknown[];
  usage_metadata?: UsageMetadata;
}

/**
 * Format a LangChain response into our AIResponse format
 */
export function formatAIResponse(response: LangChainResponse): AIResponse {
  return {
    content: response.content as string,
    finishReason: 'stop',
    usage: response.usage_metadata ? {
      promptTokens: response.usage_metadata.input_tokens || 0,
      completionTokens: response.usage_metadata.output_tokens || 0,
      totalTokens: response.usage_metadata.total_tokens || 0
    } : undefined
  };
}
