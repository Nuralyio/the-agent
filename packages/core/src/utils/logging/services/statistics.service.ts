import { ExecutionSessionLog, LoggingStats } from '../types/logging.types';

/**
 * Handles statistics tracking and calculation for execution logging
 */
export class StatisticsService {
  private stats: LoggingStats;

  constructor() {
    this.stats = {
      stepTypes: {},
      errorTypes: {},
      totalExecutionTime: 0,
      stepCount: 0
    };
  }

  /**
   * Update statistics with step execution data
   */
  updateStats(stepType: string, error?: string, executionTime?: number): void {
    // Update step type counts
    this.stats.stepTypes[stepType] = (this.stats.stepTypes[stepType] || 0) + 1;
    this.stats.stepCount++;

    // Update error type counts
    if (error) {
      const errorType = this.categorizeError(error);
      this.stats.errorTypes[errorType] = (this.stats.errorTypes[errorType] || 0) + 1;
    }

    // Update execution time
    if (executionTime) {
      this.stats.totalExecutionTime += executionTime;
    }
  }

  /**
   * Calculate final session summary
   */
  calculateSessionSummary(sessionLog: ExecutionSessionLog): void {
    // Calculate success rate
    sessionLog.summary.successRate = sessionLog.totalSteps > 0 ?
      sessionLog.successfulSteps / sessionLog.totalSteps : 0;

    // Calculate average step time
    sessionLog.summary.averageStepTime = sessionLog.totalSteps > 0 ?
      sessionLog.entries.reduce((sum, entry) => sum + entry.result.executionTimeMs, 0) / sessionLog.totalSteps : 0;

    // Copy statistics
    sessionLog.summary.stepTypes = { ...this.stats.stepTypes };
    sessionLog.summary.errorTypes = { ...this.stats.errorTypes };
  }

  /**
   * Get current statistics
   */
  getStats(): LoggingStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  reset(): void {
    this.stats = {
      stepTypes: {},
      errorTypes: {},
      totalExecutionTime: 0,
      stepCount: 0
    };
  }

  /**
   * Categorize error types for statistics
   */
  private categorizeError(error: string): string {
    const lowerError = error.toLowerCase();
    
    if (lowerError.includes('timeout')) return 'timeout';
    if (lowerError.includes('not found') || lowerError.includes('no element')) return 'element_not_found';
    if (lowerError.includes('selector')) return 'selector_invalid';
    if (lowerError.includes('network') || lowerError.includes('connection')) return 'network';
    return 'other';
  }

  /**
   * Format success rate as percentage
   */
  static formatSuccessRate(successRate: number): string {
    return `${(successRate * 100).toFixed(1)}%`;
  }

  /**
   * Format execution time in human readable format
   */
  static formatExecutionTime(milliseconds: number): string {
    if (milliseconds < 1000) return `${milliseconds}ms`;
    if (milliseconds < 60000) return `${(milliseconds / 1000).toFixed(1)}s`;
    return `${(milliseconds / 60000).toFixed(1)}m`;
  }
}
