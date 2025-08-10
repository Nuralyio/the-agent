import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { StepExecutionResult } from '../../engine/analysis/step-context';
import { ActionStep } from '../../engine/types';

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
  refinement?: {
    wasRefined: boolean;
    originalStep?: {
      description: string;
      selector?: string;
      value?: string;
    };
    refinedStep?: {
      description: string;
      selector?: string;
      value?: string;
    };
    refinementReason?: string;
    contextUsed?: {
      previousStepPatterns?: string[];
      pageContentAnalysis?: string;
    };
  };
  iteration?: {
    stepIteration: number;
    totalIterations: number;
    planAdapted: boolean;
    adaptationReason?: string;
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
    // Save screenshots directly in execution-logs folder with other files
    this.screenshotDir = this.logDir;
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
    viewport?: { width: number; height: number },
    refinementInfo?: {
      wasRefined: boolean;
      originalStep?: ActionStep;
      refinementReason?: string;
      contextUsed?: {
        previousStepPatterns?: string[];
        pageContentAnalysis?: string;
      };
    },
    iterationInfo?: {
      stepIteration: number;
      totalIterations: number;
      planAdapted: boolean;
      adaptationReason?: string;
    }
  ): Promise<void> {
    const timestamp = new Date();
    const executionTime = timestamp.getTime() - result.timestamp.getTime();

    // Save screenshot if provided
    let screenshotInfo: { filename: string; path: string } | undefined;
    if (screenshotBuffer) {
      // Include session ID in filename to avoid conflicts when saving in shared folder
      const screenshotFilename = `screenshot-${this.sessionLog.sessionId}-step-${stepIndex + 1}-${result.success ? 'success' : 'failed'}.png`;
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
      },
      ...(refinementInfo && {
        refinement: {
          wasRefined: refinementInfo.wasRefined,
          ...(refinementInfo.originalStep && {
            originalStep: {
              description: refinementInfo.originalStep.description,
              ...(refinementInfo.originalStep.target?.selector && { selector: refinementInfo.originalStep.target.selector }),
              ...(refinementInfo.originalStep.value && { value: refinementInfo.originalStep.value })
            }
          }),
          ...(refinementInfo.wasRefined && {
            refinedStep: {
              description: step.description,
              ...(step.target?.selector && { selector: step.target.selector }),
              ...(step.value && { value: step.value })
            }
          }),
          ...(refinementInfo.refinementReason && { refinementReason: refinementInfo.refinementReason }),
          ...(refinementInfo.contextUsed && { contextUsed: refinementInfo.contextUsed })
        }
      }),
      ...(iterationInfo && {
        iteration: {
          stepIteration: iterationInfo.stepIteration,
          totalIterations: iterationInfo.totalIterations,
          planAdapted: iterationInfo.planAdapted,
          ...(iterationInfo.adaptationReason && { adaptationReason: iterationInfo.adaptationReason })
        }
      })
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

      // Generate visualization and export formats
      this.generateVisualizationFormats();

      return logPath;
    } catch (error) {
      console.error(`❌ Failed to save execution log: ${error}`);
      throw error;
    }
  }

  /**
   * Generate visualization and export formats
   */
  private generateVisualizationFormats(): void {
    try {
      // Import format converter dynamically to avoid circular dependency
      const { ExecutionFormatConverter } = require('./execution-format-converter');
      const { ExecutionVisualizer } = require('../reporting/execution-visualizer');

      // Generate HTML report
      const reportFileName = `execution-report-${this.sessionLog.sessionId}.html`;
      ExecutionVisualizer.generateHTMLReport(this.sessionLog, join(this.logDir, reportFileName));

      // Generate other formats
      ExecutionFormatConverter.convertToCSV(this.sessionLog, join(this.logDir, `execution-data-${this.sessionLog.sessionId}.csv`));
      ExecutionFormatConverter.convertToJUnit(this.sessionLog, join(this.logDir, `junit-${this.sessionLog.sessionId}.xml`));

      // Generate diagram files
      const mermaidContent = ExecutionVisualizer.generateMermaidDiagram(this.sessionLog);
      const plantumlContent = ExecutionVisualizer.generatePlantUMLSequence(this.sessionLog);

      writeFileSync(join(this.logDir, `mermaid-${this.sessionLog.sessionId}.md`),
        `# Execution Flow Diagram\n\n\`\`\`mermaid\n${mermaidContent}\n\`\`\``);

      writeFileSync(join(this.logDir, `sequence-${this.sessionLog.sessionId}.puml`), plantumlContent);

      console.log(`🎨 Visualization formats generated for session ${this.sessionLog.sessionId}`);
    } catch (error) {
      console.warn(`⚠️ Failed to generate visualization formats: ${error}`);
    }
  }  /**
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
    // No need to create separate screenshot directory since we're using the same folder
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
