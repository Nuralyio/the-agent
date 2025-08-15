import { writeFileSync } from 'fs';
import { join } from 'path';
import { ScreenshotConfig } from '../types/logging.types';

/**
 * Handles screenshot saving and management for execution logging
 */
export class ScreenshotHandler {
  /**
   * Save a screenshot for a step execution
   */
  static saveScreenshot(config: ScreenshotConfig): { filename: string; path: string } | undefined {
    const { sessionId, stepIndex, success, buffer, screenshotDir } = config;

    // Include session ID in filename to avoid conflicts when saving in shared folder
    const screenshotFilename = `screenshot-${sessionId}-step-${stepIndex + 1}-${success ? 'success' : 'failed'}.png`;
    const screenshotPath = join(screenshotDir, screenshotFilename);

    try {
      writeFileSync(screenshotPath, buffer);
      console.log(`📸 Screenshot saved: ${screenshotPath}`);
      
      return {
        filename: screenshotFilename,
        path: screenshotPath
      };
    } catch (error) {
      console.warn(`⚠️ Failed to save screenshot: ${error}`);
      return undefined;
    }
  }

  /**
   * Generate screenshot filename
   */
  static generateFilename(sessionId: string, stepIndex: number, success: boolean): string {
    return `screenshot-${sessionId}-step-${stepIndex + 1}-${success ? 'success' : 'failed'}.png`;
  }

  /**
   * Validate screenshot buffer
   */
  static isValidBuffer(buffer?: Buffer): boolean {
    return buffer !== undefined && buffer.length > 0;
  }
}
