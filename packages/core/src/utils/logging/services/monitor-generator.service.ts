import { ExecutionSessionLog, ExecutionLogEntry } from '../types/logging.types';

/**
 * Generates HTML monitor reports from execution session logs
 */
export class MonitorGeneratorService {
  /**
   * Generate HTML monitor for an execution session
   */
  static generateMonitor(sessionLog: ExecutionSessionLog): string {
    const stats = sessionLog.summary;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Execution Session Monitor - ${sessionLog.sessionId}</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 20px; 
            background: #f5f5f5; 
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 8px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
            overflow: hidden; 
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 30px; 
        }
        .header h1 { 
            margin: 0 0 10px 0; 
            font-size: 2em; 
        }
        .header p { 
            margin: 0; 
            opacity: 0.9; 
        }
        .stats { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 20px; 
            padding: 30px; 
            background: #fafafa; 
        }
        .stat-card { 
            background: white; 
            padding: 20px; 
            border-radius: 8px; 
            text-align: center; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
        }
        .stat-value { 
            font-size: 2em; 
            font-weight: bold; 
            margin-bottom: 5px; 
        }
        .stat-value.success { color: #10b981; }
        .stat-value.error { color: #ef4444; }
        .stat-value.info { color: #3b82f6; }
        .stat-label { 
            color: #6b7280; 
            font-size: 0.9em; 
        }
        .timeline { 
            padding: 30px; 
        }
        .timeline h2 { 
            margin-bottom: 20px; 
            color: #374151; 
        }
        .step { 
            display: flex; 
            align-items: flex-start; 
            margin-bottom: 20px; 
            padding: 20px; 
            border-radius: 8px; 
            border-left: 4px solid #e5e7eb; 
        }
        .step.success { 
            background: #ecfdf5; 
            border-left-color: #10b981; 
        }
        .step.error { 
            background: #fef2f2; 
            border-left-color: #ef4444; 
        }
        .step-number { 
            background: #6b7280; 
            color: white; 
            border-radius: 50%; 
            width: 30px; 
            height: 30px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            margin-right: 15px; 
            font-weight: bold; 
            flex-shrink: 0; 
        }
        .step.success .step-number { background: #10b981; }
        .step.error .step-number { background: #ef4444; }
        .step-content { 
            flex: 1; 
        }
        .step-description { 
            font-weight: 600; 
            margin-bottom: 5px; 
            color: #374151; 
        }
        .step-details { 
            color: #6b7280; 
            font-size: 0.9em; 
        }
        .step-meta { 
            margin-top: 10px; 
            display: flex; 
            gap: 15px; 
            font-size: 0.8em; 
            color: #9ca3af; 
        }
        .screenshot { 
            margin-top: 10px; 
        }
        .screenshot img { 
            max-width: 200px; 
            border-radius: 4px; 
            border: 1px solid #e5e7eb; 
        }
        .error-details { 
            background: #fee; 
            border: 1px solid #fcc; 
            border-radius: 4px; 
            padding: 10px; 
            margin-top: 10px; 
            font-family: monospace; 
            font-size: 0.8em; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Execution Session</h1>
            <p>Session ID: ${sessionLog.sessionId} • ${new Date(sessionLog.startTime).toLocaleString()}</p>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-value info">${sessionLog.totalSteps}</div>
                <div class="stat-label">Total Steps</div>
            </div>
            <div class="stat-card">
                <div class="stat-value success">${sessionLog.successfulSteps}</div>
                <div class="stat-label">Successful</div>
            </div>
            <div class="stat-card">
                <div class="stat-value error">${sessionLog.failedSteps}</div>
                <div class="stat-label">Failed</div>
            </div>
            <div class="stat-card">
                <div class="stat-value info">${(stats.successRate * 100).toFixed(1)}%</div>
                <div class="stat-label">Success Rate</div>
            </div>
            <div class="stat-card">
                <div class="stat-value info">${sessionLog.totalDuration}ms</div>
                <div class="stat-label">Total Time</div>
            </div>
            <div class="stat-card">
                <div class="stat-value info">${stats.averageStepTime.toFixed(0)}ms</div>
                <div class="stat-label">Avg Step Time</div>
            </div>
        </div>
        
        <div class="timeline">
            <h2>Execution Timeline</h2>
            ${sessionLog.entries.map(entry => this.generateStepHtml(entry)).join('')}
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate HTML for individual step
   */
  private static generateStepHtml(entry: ExecutionLogEntry): string {
    const stepClass = entry.result.success ? 'success' : 'error';
    
    return `
        <div class="step ${stepClass}">
            <div class="step-number">${entry.stepIndex}</div>
            <div class="step-content">
                <div class="step-description">${entry.step.description}</div>
                <div class="step-details">
                    Type: ${entry.step.type}
                    ${entry.step.target?.selector ? ` • Selector: ${entry.step.target.selector}` : ''}
                    ${entry.step.value ? ` • Value: ${entry.step.value}` : ''}
                </div>
                <div class="step-meta">
                    <span>⏱ ${entry.result.executionTimeMs}ms</span>
                    <span>🌐 ${entry.page.url}</span>
                    ${entry.refinement?.wasRefined ? '<span>🔄 Refined</span>' : ''}
                </div>
                ${entry.result.error ? `
                    <div class="error-details">
                        <strong>Error:</strong> ${entry.result.error}
                    </div>
                ` : ''}
                ${entry.screenshot ? `
                    <div class="screenshot">
                        <img src="${entry.screenshot.path}" alt="Step ${entry.stepIndex} screenshot" 
                             title="Step ${entry.stepIndex}: ${entry.step.description}">
                    </div>
                ` : ''}
            </div>
        </div>`;
  }
}
