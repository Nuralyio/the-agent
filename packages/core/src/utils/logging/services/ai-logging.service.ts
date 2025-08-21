import * as fs from 'fs';
import * as path from 'path';
import { AIResponse } from '../../../engine/ai-engine';
import {
  AILogConfig,
  AILogMethod,
  AIRequestLogEntry,
  AIResponseLogEntry,
  AIVisionRequestLogEntry
} from '../types/ai-logging.types';

/**
 * AI Logging Service - Handles all AI-related logging operations
 */
export class AILoggingService {
  private config: AILogConfig;

  constructor(config: AILogConfig) {
    this.config = {
      enableFileSystemLogging: process.env.AI_ENABLE_FILE_LOGGING === 'true', // Default disabled, enable via env var
      ...config
    };
    this.ensureLogDirectory();
  }

  /**
   * Log AI request (prompt + system prompt)
   */
  logRequest(
    method: AILogMethod,
    prompt: string,
    systemPrompt: string | undefined,
    providerName: string
  ): void {
    try {
      const timestamp = new Date().toISOString();
      const requestData: AIRequestLogEntry = {
        timestamp,
        method,
        providerName,
        promptLength: prompt.length,
        systemPromptLength: systemPrompt?.length || 0,
        prompt: prompt,
        systemPrompt: systemPrompt || null
      };

      // Always log debug info if enabled
      this.logDebugInfo(`🤖 AI request for '${method}' - Provider: ${providerName}, Prompt length: ${prompt.length}`);

      // Only write to file system if enabled
      if (this.config.enableFileSystemLogging) {
        const logFileName = this.generateLogFileName(method, 'REQUEST', timestamp);
        const logFilePath = this.getLogFilePath(logFileName);

        // Format request log entry
        const logEntry = this.formatRequestLog(requestData, systemPrompt);

        // Write to file
        fs.writeFileSync(logFilePath, logEntry);

        this.logDebugInfo(`🤖 Logged AI request for '${method}' to: ${logFileName}`);
      }
    } catch (error) {
      console.warn(`Failed to log AI request: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Log AI response
   */
  logResponse(
    method: AILogMethod,
    response: AIResponse,
    providerName: string,
    originalPrompt: string
  ): void {
    try {
      const timestamp = new Date().toISOString();
      const responseData: AIResponseLogEntry = {
        timestamp,
        method,
        providerName,
        responseContentLength: response.content?.length || 0,
        finishReason: response.finishReason || 'unknown',
        usage: response.usage || null,
        originalPromptLength: originalPrompt.length,
        content: response.content || 'No content'
      };

      // Always log debug info if enabled
      this.logDebugInfo(`🤖 AI response for '${method}' - Provider: ${providerName}, Response length: ${response.content?.length || 0}`);

      // Only write to file system if enabled
      if (this.config.enableFileSystemLogging) {
        const logFileName = this.generateLogFileName(method, 'RESPONSE', timestamp);
        const logFilePath = this.getLogFilePath(logFileName);

        // Format response log entry
        const logEntry = this.formatResponseLog(responseData);

        // Write to file
        fs.writeFileSync(logFilePath, logEntry);

        this.logDebugInfo(`🤖 Logged AI response for '${method}' to: ${logFileName}`);
      }
    } catch (error) {
      console.warn(`Failed to log AI response: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Log AI vision request (prompt + system prompt + image info)
   */
  logVisionRequest(
    method: AILogMethod,
    prompt: string,
    systemPrompt: string | undefined,
    providerName: string,
    images: Buffer[]
  ): void {
    try {
      const timestamp = new Date().toISOString();
      const requestData: AIVisionRequestLogEntry = {
        timestamp,
        method,
        providerName,
        promptLength: prompt.length,
        systemPromptLength: systemPrompt?.length || 0,
        imageCount: images.length,
        imageSizes: images.map(img => img.length),
        totalImageDataSize: images.reduce((total, img) => total + img.length, 0),
        prompt: prompt,
        systemPrompt: systemPrompt || null
      };

      // Always log debug info if enabled
      this.logDebugInfo(`🤖 AI vision request for '${method}' - Provider: ${providerName}, Images: ${images.length}, Total size: ${requestData.totalImageDataSize} bytes`);

      // Only write to file system if enabled
      if (this.config.enableFileSystemLogging) {
        const logFileName = this.generateLogFileName(method, 'REQUEST', timestamp);
        const logFilePath = this.getLogFilePath(logFileName);

        // Format vision request log entry (without actual image data)
        const logEntry = this.formatVisionRequestLog(requestData, systemPrompt, images);

        // Write to file
        fs.writeFileSync(logFilePath, logEntry);

        this.logDebugInfo(`🤖 Logged AI vision request for '${method}' to: ${logFileName}`);
      }
    } catch (error) {
      console.warn(`Failed to log AI vision request: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate log file name with consistent format
   */
  private generateLogFileName(method: string, type: 'REQUEST' | 'RESPONSE', timestamp: string): string {
    const sanitizedMethod = method.replace(/[^a-zA-Z0-9-]/g, '-');
    const dateTime = timestamp.split('T')[0] + '-' + timestamp.split('T')[1].split('.')[0].replace(/:/g, '-');
    return `${sanitizedMethod}-${type}-${dateTime}.log`;
  }

  /**
   * Format request log entry
   */
  private formatRequestLog(requestData: AIRequestLogEntry, systemPrompt?: string): string {
    return [
      JSON.stringify(requestData, null, 2),
      '',
      '--- AI REQUEST PROMPT ---',
      requestData.prompt,
      '',
      systemPrompt ? '--- SYSTEM PROMPT ---' : '',
      systemPrompt ? systemPrompt : '',
      systemPrompt ? '' : '',
      '='.repeat(80),
      '',
      ''
    ].filter(line => line !== null).join('\n');
  }

  /**
   * Format response log entry
   */
  private formatResponseLog(responseData: AIResponseLogEntry): string {
    return [
      JSON.stringify({
        ...responseData,
        content: `[Content length: ${responseData.content.length} chars]` // Don't include full content in metadata
      }, null, 2),
      '',
      '--- AI RESPONSE ---',
      responseData.content,
      '',
      '='.repeat(80),
      '',
      ''
    ].join('\n');
  }

  /**
   * Format vision request log entry
   */
  private formatVisionRequestLog(
    requestData: AIVisionRequestLogEntry,
    systemPrompt?: string,
    images?: Buffer[]
  ): string {
    return [
      JSON.stringify({
        ...requestData,
        prompt: `[Prompt length: ${requestData.prompt.length} chars]` // Don't include full prompt in metadata
      }, null, 2),
      '',
      '--- AI VISION REQUEST PROMPT ---',
      requestData.prompt,
      '',
      systemPrompt ? '--- SYSTEM PROMPT ---' : '',
      systemPrompt ? systemPrompt : '',
      systemPrompt ? '' : '',
      '--- IMAGE INFO ---',
      `Images: ${images?.length || 0}`,
      `Total size: ${requestData.totalImageDataSize} bytes`,
      '',
      '='.repeat(80),
      '',
      ''
    ].filter(line => line !== null).join('\n');
  }

  /**
   * Get log file path
   */
  private getLogFilePath(fileName: string): string {
    return path.join(this.config.logDir, fileName);
  }

  /**
   * Ensure log directory exists
   */
  private ensureLogDirectory(): void {
    // Only create directory if file system logging is enabled
    if (this.config.enableFileSystemLogging && !fs.existsSync(this.config.logDir)) {
      fs.mkdirSync(this.config.logDir, { recursive: true });
    }
  }

  /**
   * Log debug information if enabled
   */
  private logDebugInfo(message: string): void {
    if (process.env.NODE_ENV === 'development' || process.env.AI_DEBUG === 'true') {
      console.log(message);
    }
  }

  /**
   * Update log configuration
   */
  updateConfig(newConfig: Partial<AILogConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.ensureLogDirectory();
  }

  /**
   * Check if file system logging is enabled
   */
  isFileSystemLoggingEnabled(): boolean {
    return this.config.enableFileSystemLogging === true;
  }

  /**
   * Get current log directory
   */
  getLogDirectory(): string {
    return this.config.logDir;
  }
}
