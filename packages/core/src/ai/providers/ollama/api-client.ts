import axios, { AxiosResponse } from 'axios';
import {
  OllamaChatRequest,
  OllamaChatResponse,
  OllamaGenerateRequest,
  OllamaGenerateResponse,
  OllamaModelsResponse
} from './types';

/**
 * Ollama API client utility
 * Handles low-level communication with Ollama server
 */
export class OllamaApiClient {
  constructor(private baseUrl: string, private timeout: number = 30000) { }

  /**
   * Make a generate API call to Ollama
   */
  async generate(request: OllamaGenerateRequest): Promise<OllamaGenerateResponse> {
    try {
      const response: AxiosResponse<OllamaGenerateResponse> = await axios.post(
        `${this.baseUrl}/api/generate`,
        request,
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      this.handleError(error, 'Generate API');
      throw error; // TypeScript requires this
    }
  }

  /**
   * Make a chat API call to Ollama
   */
  async chat(request: OllamaChatRequest): Promise<OllamaChatResponse> {
    try {
      const response: AxiosResponse<OllamaChatResponse> = await axios.post(
        `${this.baseUrl}/api/chat`,
        request,
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      this.handleError(error, 'Chat API');
      throw error; // TypeScript requires this
    }
  }

  /**
   * Get list of available models
   */
  async getModels(): Promise<OllamaModelsResponse> {
    try {
      const response: AxiosResponse<OllamaModelsResponse> = await axios.get(
        `${this.baseUrl}/api/tags`,
        {
          timeout: Math.min(this.timeout, 10000) // Use shorter timeout for model list
        }
      );
      return response.data;
    } catch (error) {
      this.handleError(error, 'Models API');
      throw error; // TypeScript requires this
    }
  }

  /**
   * Pull a model from Ollama registry
   */
  async pullModel(modelName: string): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/api/pull`,
        { name: modelName },
        { timeout: 300000 } // 5 minutes for model download
      );
    } catch (error) {
      this.handleError(error, `Pull model ${modelName}`);
      throw error; // TypeScript requires this
    }
  }

  /**
   * Health check - test if Ollama server is running
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Handle API errors consistently
   */
  private handleError(error: unknown, context: string): never {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.error || 'Unknown error';
      throw new Error(`Ollama ${context} error: ${error.message} - ${errorMessage}`);
    }
    throw error;
  }
}
