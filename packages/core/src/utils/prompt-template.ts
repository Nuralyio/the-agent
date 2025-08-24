/**
 * Simple prompt template loader
 * Provides basic variable substitution for external prompt files
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

    this.enableLogging = enableDebugLogging ?? (
      process.env.PROMPT_DEBUG === 'true' ||
      process.env.NODE_ENV === 'development'
    );

    if (this.enableLogging && !existsSync(this.debugLogsDir)) {
      mkdirSync(this.debugLogsDir, { recursive: true });
    }
  }

  render(templateName: string, variables: Record<string, any>): string {
    const templatePath = join(this.promptsDir, `${templateName}.txt`);

    try {
      let content = readFileSync(templatePath, 'utf8');

      for (const [key, value] of Object.entries(variables)) {
        const placeholder = `{${key}}`;
        const stringValue = String(value || '');
        content = content.replace(new RegExp(placeholder, 'g'), stringValue);
      }

      this.logPromptDebugInfo(templateName, variables, content);

      return content.trim();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load prompt template '${templateName}': ${errorMessage}`);
    }
  }

  exists(templateName: string): boolean {
    const templatePath = join(this.promptsDir, `${templateName}.txt`);
    try {
      readFileSync(templatePath);
      return true;
    } catch {
      return false;
    }
  }

  private logPromptDebugInfo(templateName: string, variables: Record<string, any>, renderedContent: string): void {
    if (!this.enableLogging) {
      return;
    }

    try {
      const timestamp = new Date().toISOString();

      const metadata = {
        timestamp,
        templateName,
        variables,
        contentLength: renderedContent.length
      };

      const sanitizedTemplateName = templateName.replace(/[^a-zA-Z0-9-]/g, '-');
      const logFileName = `${sanitizedTemplateName}-${timestamp.split('T')[0]}-${timestamp.split('T')[1].split('.')[0].replace(/:/g, '-')}.log`;
      const logFilePath = join(this.debugLogsDir, logFileName);

      const logEntry = `${JSON.stringify(metadata, null, 2)}\n\n--- RENDERED CONTENT ---\n${renderedContent}\n\n${'='.repeat(80)}\n\n`;

      writeFileSync(logFilePath, logEntry);

    } catch (error) {
      console.warn(`Failed to log prompt debug info: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

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

      const sanitizedTemplateName = templateName.replace(/[^a-zA-Z0-9-]/g, '-');
      const logFileName = `${sanitizedTemplateName}-RESPONSE-${timestamp.split('T')[0]}-${timestamp.split('T')[1].split('.')[0].replace(/:/g, '-')}.log`;
      const logFilePath = join(this.debugLogsDir, logFileName);

      const logEntry = `${JSON.stringify(responseMetadata, null, 2)}\n\n--- AI PROVIDER RESPONSE ---\n${response.content || 'No content'}\n\n${'='.repeat(80)}\n\n`;

      writeFileSync(logFilePath, logEntry);

      if (process.env.NODE_ENV === 'development' || process.env.PROMPT_DEBUG === 'true') {
        console.log(`🤖 Logged ${providerName} response for '${templateName}' to: ${logFileName}`);
      }
    } catch (error) {
      console.warn(`Failed to log provider response: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
