/**
 * Simple prompt template loader
 * Provides basic variable substitution for external prompt files
 * Optionally logs debug information to ai-debug-logs directory
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export class PromptTemplate {
  private readonly promptsDir: string;
  private readonly debugLogsDir: string;
  private readonly enableLogging: boolean;

  constructor(enableDebugLogging?: boolean) {
    this.promptsDir = join(__dirname, 'prompts');
    this.debugLogsDir = join(__dirname, '..', '..', 'ai-debug-logs');
    
    // Enable logging based on parameter, environment variable, or development mode
    this.enableLogging = enableDebugLogging ?? (
      process.env.PROMPT_DEBUG === 'true' || 
      process.env.NODE_ENV === 'development'
    );

    // Ensure debug logs directory exists
    if (this.enableLogging && !existsSync(this.debugLogsDir)) {
      mkdirSync(this.debugLogsDir, { recursive: true });
    }
  }

  /**
   * Load and render a prompt template with variables
   * @param templateName Name of the template file (without .txt extension)
   * @param variables Object containing variable values for substitution
   * @returns Rendered prompt string
   */
  render(templateName: string, variables: Record<string, any>): string {
    const templatePath = join(this.promptsDir, `${templateName}.txt`);

    try {
      let content = readFileSync(templatePath, 'utf8');

      // Simple variable substitution using {variableName} syntax
      for (const [key, value] of Object.entries(variables)) {
        const placeholder = `{${key}}`;
        const stringValue = String(value || '');
        content = content.replace(new RegExp(placeholder, 'g'), stringValue);
      }

      // Save debug information to log files
      this.logPromptDebugInfo(templateName, variables, content);

      return content.trim();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load prompt template '${templateName}': ${errorMessage}`);
    }
  }

  /**
   * Check if a template exists
   * @param templateName Name of the template file (without .txt extension)
   * @returns True if template exists
   */
  exists(templateName: string): boolean {
    const templatePath = join(this.promptsDir, `${templateName}.txt`);
    try {
      readFileSync(templatePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Log prompt template debug information to files
   * @param templateName Name of the template used
   * @param variables Variables passed to the template
   * @param renderedContent Final rendered content
   */
  private logPromptDebugInfo(templateName: string, variables: Record<string, any>, renderedContent: string): void {
    if (!this.enableLogging) {
      return;
    }

    try {
      const timestamp = new Date().toISOString();
      
      // Create metadata as JSON object
      const metadata = {
        timestamp,
        templateName,
        variables,
        contentLength: renderedContent.length
      };

      // Create separate log file for each prompt template with timestamp
      const sanitizedTemplateName = templateName.replace(/[^a-zA-Z0-9-]/g, '-');
      const logFileName = `${sanitizedTemplateName}-${timestamp.split('T')[0]}-${timestamp.split('T')[1].split('.')[0].replace(/:/g, '-')}.log`;
      const logFilePath = join(this.debugLogsDir, logFileName);

      // Format log entry: JSON metadata + plain text content
      const logEntry = `${JSON.stringify(metadata, null, 2)}\n\n--- RENDERED CONTENT ---\n${renderedContent}\n\n${'='.repeat(80)}\n\n`;

      // Write to individual file (each prompt gets its own file)
      writeFileSync(logFilePath, logEntry);

      // Optional: Console log for immediate debugging (only if explicitly enabled)
      if (process.env.NODE_ENV === 'development' || process.env.PROMPT_DEBUG === 'true') {
        console.log(`🔄 Logged prompt template '${templateName}' to: ${logFileName}`);
      }
    } catch (error) {
      // Silently fail logging to not break the main functionality
      console.warn(`Failed to log prompt debug info: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Log AI provider response for a specific template
   * @param templateName Name of the template that was used
   * @param response AI provider response
   * @param providerName Name of the AI provider (e.g., 'openai', 'ollama')
   */
  logProviderResponse(templateName: string, response: any, providerName: string): void {
    try {
      const timestamp = new Date().toISOString();
      
      const responseMetadata = {
        timestamp,
        templateName,
        providerName,
        responseContentLength: typeof response.content === 'string' ? response.content.length : 0,
        finishReason: response.finishReason || 'unknown',
        usage: response.usage || null
      };

      // Create response log file matching the template log file naming
      const sanitizedTemplateName = templateName.replace(/[^a-zA-Z0-9-]/g, '-');
      const logFileName = `${sanitizedTemplateName}-RESPONSE-${timestamp.split('T')[0]}-${timestamp.split('T')[1].split('.')[0].replace(/:/g, '-')}.log`;
      const logFilePath = join(this.debugLogsDir, logFileName);

      // Format response log entry
      const logEntry = `${JSON.stringify(responseMetadata, null, 2)}\n\n--- AI PROVIDER RESPONSE ---\n${response.content || 'No content'}\n\n${'='.repeat(80)}\n\n`;

      // Write to individual response file
      writeFileSync(logFilePath, logEntry);

      // Optional: Console log for immediate debugging
      if (process.env.NODE_ENV === 'development' || process.env.PROMPT_DEBUG === 'true') {
        console.log(`🤖 Logged ${providerName} response for '${templateName}' to: ${logFileName}`);
      }
    } catch (error) {
      // Silently fail logging to not break the main functionality
      console.warn(`Failed to log provider response: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
