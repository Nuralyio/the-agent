import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  OpenAICompletionRequest,
  OpenAICompletionResponse,
  OpenAIModelsResponse,
  OpenAIErrorResponse
} from './types';

/**
 * OpenAI API Client
 * Handles direct communication with OpenAI's REST API
 */
export class OpenAIApiClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey: string, baseUrl: string = 'https://api.openai.com/v1', timeout: number = 30000) {
    this.apiKey = apiKey;
    
    this.client = axios.create({
      baseURL: baseUrl,
      timeout,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'TheAgent-Core/1.0.0'
      }
    });

    // Add request/response interceptors for debugging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`🔵 OpenAI API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('🔴 OpenAI API Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        console.log(`🟢 OpenAI API Response: ${response.status} ${response.statusText}`);
        return response;
      },
      (error) => {
        console.error('🔴 OpenAI API Response Error:', error.response?.status, error.response?.data);
        return Promise.reject(this.handleApiError(error));
      }
    );
  }

  /**
   * Create a chat completion
   */
  async createChatCompletion(request: OpenAICompletionRequest): Promise<OpenAICompletionResponse> {
    try {
      const response: AxiosResponse<OpenAICompletionResponse> = await this.client.post('/chat/completions', request);
      return response.data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  /**
   * Get available models
   */
  async getModels(): Promise<OpenAIModelsResponse> {
    try {
      const response: AxiosResponse<OpenAIModelsResponse> = await this.client.get('/models');
      return response.data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  /**
   * Health check - test API connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/models', { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      console.warn('🟡 OpenAI health check failed:', error instanceof Error ? error.message : String(error));
      return false;
    }
  }

  /**
   * Handle API errors and convert to standardized format
   */
  private handleApiError(error: any): Error {
    if (error.response) {
      const data = error.response.data as OpenAIErrorResponse;
      const message = data.error?.message || 'Unknown OpenAI API error';
      const statusCode = error.response.status;
      
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
    } else if (error.request) {
      return new Error('OpenAI API request failed: No response received');
    } else {
      return new Error(`OpenAI API error: ${error.message}`);
    }
  }
}
