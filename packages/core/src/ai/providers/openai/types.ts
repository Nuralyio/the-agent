/**
 * OpenAI API Types
 */

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | OpenAIMessageContent[];
}

export interface OpenAIMessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
    detail?: 'low' | 'high' | 'auto';
  };
}

export interface OpenAICompletionRequest {
  model: string;
  messages: OpenAIMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
  response_format?: {
    type: 'text' | 'json_object';
  };
}

export interface OpenAICompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenAIChoice[];
  usage: OpenAIUsage;
}

export interface OpenAIChoice {
  index: number;
  message: OpenAIMessage;
  finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null;
}

export interface OpenAIUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface OpenAIModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

export interface OpenAIModelsResponse {
  object: string;
  data: OpenAIModel[];
}

export interface OpenAIErrorResponse {
  error: {
    message: string;
    type: string;
    param?: string;
    code?: string;
  };
}
