import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { FileConfig, ExecutionSessionLog } from '../types/logging.types';

/**
 * Manages file operations for execution logging
 */
export class FileManagementService {
  private config: FileConfig;

  constructor(config: FileConfig) {
    this.config = config;
    this.ensureDirectories();
  }

  /**
   * Save execution session log to JSON file
   */
  saveSessionLog(sessionLog: ExecutionSessionLog): string {
    const logFilename = `execution-${sessionLog.sessionId}.json`;
    const logPath = join(this.config.logDir, logFilename);

    try {
      writeFileSync(logPath, JSON.stringify(sessionLog, null, 2));
      console.log(`📋 Execution log saved: ${logPath}`);
      return logPath;
    } catch (error) {
      console.error(`❌ Failed to save execution log: ${error}`);
      throw error;
    }
  }

  /**
   * Save content to a file
   */
  saveFile(filename: string, content: string): void {
    const filePath = join(this.config.logDir, filename);
    try {
      writeFileSync(filePath, content);
      console.log(`📄 File saved: ${filePath}`);
    } catch (error) {
      console.warn(`⚠️ Failed to save file ${filename}: ${error}`);
    }
  }

  /**
   * Get log directory path
   */
  getLogDir(): string {
    return this.config.logDir;
  }

  /**
   * Get screenshot directory path
   */
  getScreenshotDir(): string {
    return this.config.screenshotDir;
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.config.sessionId;
  }

  /**
   * Ensure required directories exist
   */
  private ensureDirectories(): void {
    if (!existsSync(this.config.logDir)) {
      mkdirSync(this.config.logDir, { recursive: true });
    }
    // Screenshot directory is the same as log directory in current implementation
  }

  /**
   * Static method to ensure directory exists
   */
  static async ensureDirectoryExists(dirPath: string): Promise<void> {
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Static method to ensure directory exists synchronously
   */
  static ensureDirectoryExistsSync(dirPath: string): void {
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Static method to write JSON file
   */
  static async writeJsonFile(filePath: string, data: any): Promise<void> {
    try {
      writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Failed to write JSON file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Static method to write HTML file
   */
  static async writeHtmlFile(filePath: string, html: string): Promise<void> {
    try {
      writeFileSync(filePath, html);
    } catch (error) {
      console.error(`Failed to write HTML file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Generate session ID
   */
  static generateSessionId(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}`;
  }
}
