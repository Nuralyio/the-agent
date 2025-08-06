import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { StepExecutionResult } from '../engine/step-context';
import { ActionStep } from '../types';

/**
 * Execution log entry for JSON format
 */
export interface ExecutionLogEntry {
  timestamp: string;
  sessionId: string;
  stepIndex: number;
  step: {
    type: string;
    description: string;
    target?: {
      selector?: string;
      description?: string;
    };
    value?: string;
  };
  result: {
    success: boolean;
    error?: string;
    elementFound?: boolean;
    selectorUsed?: string;
    valueEntered?: string;
    executionTimeMs: number;
  };
  page: {
    url: string;
    title: string;
    viewport?: {
      width: number;
      height: number;
    };
  };
  screenshot?: {
    filename: string;
    path: string;
  };
  context?: {
    previousStepsCount: number;
    sessionDuration: number;
  };
}

/**
 * Complete execution session log
 */
export interface ExecutionSessionLog {
  sessionId: string;
  startTime: string;
  endTime?: string;
  instruction: string;
  totalSteps: number;
  successfulSteps: number;
  failedSteps: number;
  totalDuration: number;
  success: boolean;
  entries: ExecutionLogEntry[];
  summary: {
    stepTypes: Record<string, number>;
    errorTypes: Record<string, number>;
    averageStepTime: number;
    successRate: number;
  };
}

/**
 * Execution logger for tracking automation sessions
 */
export class ExecutionLogger {
  private sessionLog: ExecutionSessionLog;
  private logDir: string;
  private screenshotDir: string;
  private startTime: Date;

  constructor(instruction: string, sessionId?: string) {
    this.startTime = new Date();
    this.sessionLog = {
      sessionId: sessionId || this.generateSessionId(),
      startTime: this.startTime.toISOString(),
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

    // Setup directories
    this.logDir = join(process.cwd(), 'execution-logs');
    this.screenshotDir = join(this.logDir, 'screenshots', this.sessionLog.sessionId);
    this.ensureDirectories();
  }

  /**
   * Log a step execution result
   */
  async logStepExecution(
    stepIndex: number,
    step: ActionStep,
    result: StepExecutionResult,
    pageUrl: string,
    pageTitle: string,
    screenshotBuffer?: Buffer,
    viewport?: { width: number; height: number }
  ): Promise<void> {
    const timestamp = new Date();
    const executionTime = timestamp.getTime() - result.timestamp.getTime();

    // Save screenshot if provided
    let screenshotInfo: { filename: string; path: string } | undefined;
    if (screenshotBuffer) {
      const screenshotFilename = `step-${stepIndex + 1}-${result.success ? 'success' : 'failed'}.png`;
      const screenshotPath = join(this.screenshotDir, screenshotFilename);

      try {
        writeFileSync(screenshotPath, screenshotBuffer);
        screenshotInfo = {
          filename: screenshotFilename,
          path: screenshotPath
        };
        console.log(`📸 Screenshot saved: ${screenshotPath}`);
      } catch (error) {
        console.warn(`⚠️ Failed to save screenshot: ${error}`);
      }
    }

    // Create log entry
    const logEntry: ExecutionLogEntry = {
      timestamp: timestamp.toISOString(),
      sessionId: this.sessionLog.sessionId,
      stepIndex: stepIndex + 1,
      step: {
        type: step.type,
        description: step.description,
        ...(step.target && {
          target: {
            ...(step.target.selector && { selector: step.target.selector }),
            ...(step.target.description && { description: step.target.description })
          }
        }),
        ...(step.value && { value: step.value })
      },
      result: {
        success: result.success,
        executionTimeMs: executionTime,
        ...(result.error && { error: result.error }),
        ...(result.elementFound !== undefined && { elementFound: result.elementFound }),
        ...(result.selectorUsed && { selectorUsed: result.selectorUsed }),
        ...(result.valueEntered && { valueEntered: result.valueEntered })
      },
      page: {
        url: pageUrl,
        title: pageTitle,
        ...(viewport && { viewport })
      },
      ...(screenshotInfo && { screenshot: screenshotInfo }),
      context: {
        previousStepsCount: stepIndex,
        sessionDuration: timestamp.getTime() - this.startTime.getTime()
      }
    };

    // Add to session log
    this.sessionLog.entries.push(logEntry);
    this.sessionLog.totalSteps++;

    if (result.success) {
      this.sessionLog.successfulSteps++;
    } else {
      this.sessionLog.failedSteps++;
    }

    // Update summary statistics
    this.updateSummaryStats(step.type, result.error, executionTime);

    console.log(`📝 Logged step ${stepIndex + 1}: ${step.description} - ${result.success ? '✅' : '❌'}`);
  }

  /**
   * Finalize the session log
   */
  finishSession(success: boolean): string {
    const endTime = new Date();
    this.sessionLog.endTime = endTime.toISOString();
    this.sessionLog.totalDuration = endTime.getTime() - this.startTime.getTime();
    this.sessionLog.success = success;

    // Calculate final summary
    this.sessionLog.summary.successRate = this.sessionLog.totalSteps > 0 ?
      this.sessionLog.successfulSteps / this.sessionLog.totalSteps : 0;

    this.sessionLog.summary.averageStepTime = this.sessionLog.totalSteps > 0 ?
      this.sessionLog.entries.reduce((sum, entry) => sum + entry.result.executionTimeMs, 0) / this.sessionLog.totalSteps : 0;

    // Save the complete log
    const logFilename = `execution-${this.sessionLog.sessionId}.json`;
    const logPath = join(this.logDir, logFilename);

    try {
      writeFileSync(logPath, JSON.stringify(this.sessionLog, null, 2));
      console.log(`📋 Execution log saved: ${logPath}`);
      console.log(`📊 Session Summary: ${this.sessionLog.successfulSteps}/${this.sessionLog.totalSteps} steps successful (${(this.sessionLog.summary.successRate * 100).toFixed(1)}%)`);

      return logPath;
    } catch (error) {
      console.error(`❌ Failed to save execution log: ${error}`);
      throw error;
    }
  }

  /**
   * Get the current session ID
   */
  getSessionId(): string {
    return this.sessionLog.sessionId;
  }

  /**
   * Get the screenshot directory for this session
   */
  getScreenshotDir(): string {
    return this.screenshotDir;
  }

  private generateSessionId(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}`;
  }

  private ensureDirectories(): void {
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
    if (!existsSync(this.screenshotDir)) {
      mkdirSync(this.screenshotDir, { recursive: true });
    }
  }

  private updateSummaryStats(stepType: string, error?: string, executionTime?: number): void {
    // Update step type counts
    this.sessionLog.summary.stepTypes[stepType] = (this.sessionLog.summary.stepTypes[stepType] || 0) + 1;

    // Update error type counts
    if (error) {
      const errorType = this.categorizeError(error);
      this.sessionLog.summary.errorTypes[errorType] = (this.sessionLog.summary.errorTypes[errorType] || 0) + 1;
    }
  }

  private categorizeError(error: string): string {
    if (error.toLowerCase().includes('timeout')) return 'timeout';
    if (error.toLowerCase().includes('not found') || error.toLowerCase().includes('no element')) return 'element_not_found';
    if (error.toLowerCase().includes('selector')) return 'selector_invalid';
    if (error.toLowerCase().includes('network') || error.toLowerCase().includes('connection')) return 'network';
    return 'other';
  }
}
