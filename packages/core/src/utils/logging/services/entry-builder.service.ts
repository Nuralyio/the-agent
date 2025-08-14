import { ExecutionLogEntry, StepLogConfig } from '../types/logging.types';
import { ScreenshotHandler } from '../handlers/screenshot-handler';

/**
 * Builds execution log entries from step execution data
 */
export class EntryBuilderService {
  /**
   * Build a complete execution log entry
   */
  static buildLogEntry(config: StepLogConfig, screenshotDir: string, sessionId: string): ExecutionLogEntry {
    const {
      stepIndex,
      step,
      result,
      pageUrl,
      pageTitle,
      screenshotBuffer,
      viewport,
      refinementInfo,
      iterationInfo
    } = config;

    const timestamp = new Date();
    const executionTime = timestamp.getTime() - result.timestamp.getTime();

    // Handle screenshot saving
    let screenshotInfo: { filename: string; path: string } | undefined;
    if (screenshotBuffer && ScreenshotHandler.isValidBuffer(screenshotBuffer)) {
      screenshotInfo = ScreenshotHandler.saveScreenshot({
        sessionId,
        stepIndex,
        success: result.success,
        buffer: screenshotBuffer,
        screenshotDir
      });
    }

    // Build the log entry
    const logEntry: ExecutionLogEntry = {
      timestamp: timestamp.toISOString(),
      sessionId,
      stepIndex: stepIndex + 1,
      step: this.buildStepInfo(step),
      result: this.buildResultInfo(result, executionTime),
      page: this.buildPageInfo(pageUrl, pageTitle, viewport),
      ...(screenshotInfo && { screenshot: screenshotInfo }),
      ...(refinementInfo && { refinement: this.buildRefinementInfo(refinementInfo) }),
      ...(iterationInfo && { iteration: iterationInfo })
    };

    return logEntry;
  }

  /**
   * Build step information object
   */
  private static buildStepInfo(step: any): any {
    return {
      type: step.type,
      description: step.description,
      ...(step.target && {
        target: {
          ...(step.target.selector && { selector: step.target.selector }),
          ...(step.target.description && { description: step.target.description })
        }
      }),
      ...(step.value && { value: step.value })
    };
  }

  /**
   * Build result information object
   */
  private static buildResultInfo(result: any, executionTime: number): any {
    return {
      success: result.success,
      executionTimeMs: executionTime,
      ...(result.error && { error: result.error }),
      ...(result.elementFound !== undefined && { elementFound: result.elementFound }),
      ...(result.selectorUsed && { selectorUsed: result.selectorUsed }),
      ...(result.valueEntered && { valueEntered: result.valueEntered })
    };
  }

  /**
   * Build page information object
   */
  private static buildPageInfo(url: string, title: string, viewport?: { width: number; height: number }): any {
    return {
      url,
      title,
      ...(viewport && { viewport })
    };
  }

  /**
   * Build refinement information object
   */
  private static buildRefinementInfo(refinementInfo: any): any {
    return {
      wasRefined: refinementInfo.wasRefined,
      ...(refinementInfo.originalStep && {
        originalStep: {
          description: refinementInfo.originalStep.description,
          ...(refinementInfo.originalStep.target?.selector && { selector: refinementInfo.originalStep.target.selector }),
          ...(refinementInfo.originalStep.value && { value: refinementInfo.originalStep.value })
        }
      }),
      ...(refinementInfo.refinementReason && { refinementReason: refinementInfo.refinementReason }),
      ...(refinementInfo.contextUsed && { contextUsed: refinementInfo.contextUsed })
    };
  }
}
