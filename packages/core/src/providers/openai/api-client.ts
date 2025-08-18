import OpenAI from 'openai';
import {
  OpenAICompletionRequest,
  OpenAICompletionResponse,
  OpenAIModelsResponse,
  OpenAIErrorResponse
} from './types';

/**
 * OpenAI API Client
 * Handles communication with OpenAI's API using the official SDK
 */
export class OpenAIApiClient {
  private client: OpenAI;

  constructor(apiKey: string, baseUrl: string = 'https://api.openai.com/v1', timeout: number = 30000) {
    this.client = new OpenAI({
      apiKey,
      baseURL: baseUrl,
      timeout,
      defaultHeaders: {
        'User-Agent': 'TheAgent-Core/1.0.0'
      }
    });
  }

  /**
   * Create a chat completion
   */
  async createChatCompletion(request: OpenAICompletionRequest): Promise<OpenAICompletionResponse> {
    try {
      console.log(`🔵 OpenAI API Request: POST /chat/completions`);
      
      // Convert our message format to OpenAI SDK format
      const messages = request.messages.map(msg => ({
        role: msg.role,
        content: Array.isArray(msg.content) 
          ? msg.content.map(c => c.type === 'text' ? { type: 'text', text: c.text || '' } : c)
          : msg.content
      })) as OpenAI.Chat.Completions.ChatCompletionMessageParam[];

      const response = await this.client.chat.completions.create({
        model: request.model,
        messages,
        temperature: request.temperature,
        max_tokens: request.max_tokens,
        top_p: request.top_p,
        frequency_penalty: request.frequency_penalty,
        presence_penalty: request.presence_penalty,
        stream: false, // We always want non-streaming response for this method
        response_format: request.response_format
      }) as OpenAI.Chat.Completions.ChatCompletion;

      console.log(`🟢 OpenAI API Response: 200 OK`);
      
      // Convert OpenAI SDK response to our interface
      return {
        id: response.id,
        object: response.object,
        created: response.created,
        model: response.model,
        choices: response.choices.map(choice => ({
          index: choice.index,
          message: {
            role: choice.message.role as 'system' | 'user' | 'assistant',
            content: choice.message.content || ''
          },
          finish_reason: choice.finish_reason as 'stop' | 'length' | 'tool_calls' | 'content_filter' | null
        })),
        usage: response.usage ? {
          prompt_tokens: response.usage.prompt_tokens,
          completion_tokens: response.usage.completion_tokens,
          total_tokens: response.usage.total_tokens
        } : {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        }
      };
    } catch (error) {
      console.error('🔴 OpenAI API Response Error:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Get available models
   */
  async getModels(): Promise<OpenAIModelsResponse> {
    try {
      console.log(`🔵 OpenAI API Request: GET /models`);
      
      const response = await this.client.models.list();
      
      console.log(`🟢 OpenAI API Response: 200 OK`);
      
      return {
        object: 'list',
        data: response.data.map(model => ({
          id: model.id,
          object: model.object,
          created: model.created,
          owned_by: model.owned_by
        }))
      };
    } catch (error) {
      console.error('🔴 OpenAI API Response Error:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Health check - test API connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch (error) {
      console.warn('🟡 OpenAI health check failed:', error instanceof Error ? error.message : String(error));
      return false;
    }
  }

  /**
   * Handle API errors and convert to standardized format
   */
  private handleApiError(error: any): Error {
    if (error instanceof OpenAI.APIError) {
      const statusCode = error.status;
      const message = error.message || 'Unknown OpenAI API error';
      
      switch (statusCode) {
        case 401:
          return new Error(`OpenAI API authentication failed: ${message}`);
        case 403:
          return new Error(`OpenAI API access forbidden: ${message}`);
        case 404:
          return new Error(`OpenAI API endpoint not found: ${message}`);
        case 429:
          return new Error(`OpenAI API rate limit exceeded: ${message}`);
        case 500:
        case 502:
        case 503:
        case 504:
          return new Error(`OpenAI API server error (${statusCode}): ${message}`);
        default:
          return new Error(`OpenAI API error (${statusCode}): ${message}`);
      }
    } else if (error instanceof OpenAI.APIConnectionError) {
      return new Error(`OpenAI API connection failed: ${error.message}`);
    } else if (error instanceof OpenAI.RateLimitError) {
      return new Error(`OpenAI API rate limit exceeded: ${error.message}`);
    } else {
      return new Error(`OpenAI API error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
