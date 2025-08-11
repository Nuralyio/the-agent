/**
 * Simple prompt template loader
 * Provides basic variable substitution for external prompt files
 */

import { readFileSync } from 'fs';
import { join } from 'path';

export class PromptTemplate {
  private readonly promptsDir: string;

  constructor() {
    this.promptsDir = join(__dirname, 'prompts');
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
}
