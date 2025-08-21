import path from 'path';
import { loadEnvironmentConfig } from '../../environment';
import { EntryBuilderService } from './services/entry-builder.service';
import { FileManagementService } from './services/file-management.service';
import { MonitorGeneratorService } from './services/monitor-generator.service';
import { StatisticsService } from './services/statistics.service';
import { ExecutionSessionLog, StepLogConfig } from './types/logging.types';

/**
 * Handles execution logging with session tracking, screenshots, and statistics
 */
export class ExecutionLogger {
  private sessionLog: ExecutionSessionLog;
  private statisticsService: StatisticsService;
  private screenshotDir: string;

  /**
   * Initialize a new execution logger for a session
   */
  constructor(
    private instruction: string,
    private baseDir: string = loadEnvironmentConfig().execution.logsDir
  ) {
    this.sessionLog = this.initializeSessionLog(this.instruction);
    this.statisticsService = new StatisticsService();
    this.screenshotDir = path.join(baseDir, 'screenshots', this.sessionLog.sessionId);

    // Ensure directories exist synchronously
    this.ensureDirectories();
  }

  /**
   * Ensure required directories exist
   */
  private ensureDirectories(): void {
    try {
      FileManagementService.ensureDirectoryExistsSync(this.baseDir);
      FileManagementService.ensureDirectoryExistsSync(this.screenshotDir);
    } catch (error) {
      console.warn('Failed to create directories:', error);
    }
  }

  /**
   * Log a step execution
   */
  async logStep(config: StepLogConfig): Promise<void> {
    try {
      // Build log entry using the builder service
      const logEntry = EntryBuilderService.buildLogEntry(
        config,
        this.screenshotDir,
        this.sessionLog.sessionId
      );

      // Update session tracking
      this.sessionLog.entries.push(logEntry);
      this.sessionLog.totalSteps++;

      if (config.result.success) {
        this.sessionLog.successfulSteps++;
      } else {
        this.sessionLog.failedSteps++;
      }

      // Update statistics
      this.statisticsService.updateStats(
        config.step.type,
        config.result.error,
        logEntry.result.executionTimeMs
      );

      // Write to JSON file
      await this.writeLogFile();

    } catch (error) {
      console.error('Failed to log step:', error);
    }
  }

  /**
   * Complete the session and finalize logs
   */
  async completeSession(success: boolean): Promise<string> {
    try {
      this.sessionLog.endTime = new Date().toISOString();
      this.sessionLog.success = success;
      this.sessionLog.totalDuration = this.calculateSessionDuration();

      // Calculate final session statistics
      this.statisticsService.calculateSessionSummary(this.sessionLog);

      // Write final log file
      await this.writeLogFile();

      // Generate and save HTML monitor
      const monitorPath = await this.generateMonitor();

      return monitorPath;

    } catch (error) {
      console.error('Failed to complete session:', error);
      throw error;
    }
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionLog.sessionId;
  }

  /**
   * Get current session log
   */
  getSessionLog(): ExecutionSessionLog {
    return { ...this.sessionLog };
  }

  /**
   * Initialize a new session log
   */
  private initializeSessionLog(instruction: string): ExecutionSessionLog {
    const sessionId = FileManagementService.generateSessionId();

    return {
      sessionId,
      startTime: new Date().toISOString(),
      instruction,
      totalSteps: 0,
      successfulSteps: 0,
      failedSteps: 0,
      totalDuration: 0,
      success: false,
      entries: [],
      summary: {
        stepTypes: {},
        errorTypes: {},
        averageStepTime: 0,
        successRate: 0
      }
    };
  }

  /**
   * Write current session log to JSON file
   */
  private async writeLogFile(): Promise<void> {
    const filename = `execution-${this.sessionLog.sessionId}.json`;
    const filePath = path.join(this.baseDir, filename);

    await FileManagementService.writeJsonFile(filePath, this.sessionLog);
  }

  /**
   * Generate HTML monitor
   */
  private async generateMonitor(): Promise<string> {
    const html = MonitorGeneratorService.generateMonitor(this.sessionLog);
    const filename = `execution-${this.sessionLog.sessionId}.html`;
    const filePath = path.join(this.baseDir, filename);

    await FileManagementService.writeHtmlFile(filePath, html);
    return filePath;
  }

  /**
   * Calculate total session duration
   */
  private calculateSessionDuration(): number {
    if (!this.sessionLog.endTime) return 0;

    const startTime = new Date(this.sessionLog.startTime).getTime();
    const endTime = new Date(this.sessionLog.endTime).getTime();
    return endTime - startTime;
  }

  /**
   * Create a logger instance with step logging helper
   */
  static async createWithStepLogging(
    instruction: string,
    baseDir?: string
  ): Promise<ExecutionLogger> {
    const logger = new ExecutionLogger(instruction, baseDir);

    // Ensure directories exist
    await FileManagementService.ensureDirectoryExists(path.join(baseDir || loadEnvironmentConfig().execution.logsDir));
    await FileManagementService.ensureDirectoryExists(logger.screenshotDir);

    return logger;
  }
}
