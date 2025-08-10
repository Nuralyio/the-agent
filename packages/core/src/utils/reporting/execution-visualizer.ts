import { writeFileSync } from 'fs';
import { join } from 'path';
import { ExecutionSessionLog } from '../logging/execution-logger';

/**
 * HTML visualization generator for execution logs
 */
export class ExecutionVisualizer {
  /**
   * Generate an interactive HTML report from execution log
   */
  static generateHTMLReport(sessionLog: ExecutionSessionLog, outputPath?: string): string {
    const htmlContent = this.createHTMLContent(sessionLog);
    
    const fileName = `execution-report-${sessionLog.sessionId}.html`;
    const filePath = outputPath || join(process.cwd(), 'execution-logs', fileName);
    
    writeFileSync(filePath, htmlContent);
    console.log(`📊 Interactive HTML report generated: ${filePath}`);
    
    return filePath;
  }

  /**
   * Generate Mermaid diagram for the execution flow with detailed refinement information
   */
  static generateMermaidDiagram(sessionLog: ExecutionSessionLog): string {
    let mermaid = 'graph TD\n';
    mermaid += '    Start([Session Started]) --> Step1\n';
    
    sessionLog.entries.forEach((entry, index) => {
      const stepId = `Step${index + 1}`;
      const nextStepId = index + 1 < sessionLog.entries.length ? `Step${index + 2}` : 'End';
      
      // Check if this step was refined
      const wasRefined = entry.refinement?.wasRefined || false;
      
      // Create step node with status color
      const status = entry.result.success ? '✅' : '❌';
      const stepType = entry.step.type.toUpperCase();
      const refinementIndicator = wasRefined ? '🔄' : '';
      
      // Build main step description - escape quotes and special characters
      const stepDescription = this.escapeForMermaid(entry.step.description);
      
      const nodeStyle = entry.result.success ? 
        (wasRefined ? 'fill:#fff3cd,stroke:#856404' : 'fill:#d4edda,stroke:#155724') : 
        'fill:#f8d7da,stroke:#721c24';
      
      // Main step node - simplified for better readability
      mermaid += `    ${stepId}['${status} ${refinementIndicator} ${stepType}<br/>${stepDescription}<br/>⏱️ ${entry.result.executionTimeMs}ms']\n`;
      mermaid += `    style ${stepId} ${nodeStyle}\n`;
      
      // Create refinement subtree if step was refined
      if (wasRefined && entry.refinement?.originalStep) {
        const refinementId = `${stepId}_refinement`;
        const originalId = `${stepId}_original`;
        const refinedId = `${stepId}_refined`;
        const reasonId = `${stepId}_reason`;
        
        const originalSelector = this.escapeForMermaid(entry.refinement.originalStep.selector || 'N/A');
        const refinedSelector = this.escapeForMermaid(entry.step.target?.selector || 'N/A');
        const reason = this.escapeForMermaid(entry.refinement.refinementReason || 'Context improvement');
        
        // Create refinement subtree
        mermaid += `    ${stepId} -.-> ${refinementId}[🔄 Refinement Details]\n`;
        mermaid += `    style ${refinementId} fill:#f0f8ff,stroke:#4682b4,stroke-dasharray: 5 5\n`;
        
        // Original selector node
        mermaid += `    ${refinementId} --> ${originalId}['🔍 Original:<br/>${originalSelector}']\n`;
        mermaid += `    style ${originalId} fill:#ffe6e6,stroke:#dc3545\n`;
        
        // Refined selector node  
        mermaid += `    ${refinementId} --> ${refinedId}['🎯 Refined:<br/>${refinedSelector}']\n`;
        mermaid += `    style ${refinedId} fill:#e6ffe6,stroke:#28a745\n`;
        
        // Reason node
        mermaid += `    ${refinementId} --> ${reasonId}['💡 Reason:<br/>${reason}']\n`;
        mermaid += `    style ${reasonId} fill:#fff3cd,stroke:#856404\n`;
      }
      
      // Connect to next step or end
      if (index + 1 < sessionLog.entries.length) {
        mermaid += `    ${stepId} --> ${nextStepId}\n`;
      } else {
        mermaid += `    ${stepId} --> End([Session Completed])\n`;
      }
    });
    
    mermaid += `    style Start fill:#e7f3ff,stroke:#004085\n`;
    mermaid += `    style End fill:#e7f3ff,stroke:#004085\n`;
    
    return mermaid;
  }

  /**
   * Escape special characters for Mermaid diagram syntax
   */
  private static escapeForMermaid(text: string): string {
    return text
      .replace(/"/g, "'")       // Replace double quotes with single quotes
      .replace(/\n/g, ' ')      // Replace newlines with spaces
      .replace(/\t/g, ' ')      // Replace tabs with spaces
      .replace(/\[/g, '_LB_')   // Replace square brackets with placeholders
      .replace(/\]/g, '_RB_')
      .replace(/\{/g, '_LC_')   // Replace curly brackets with placeholders
      .replace(/\}/g, '_RC_')
      .replace(/\(/g, '_LP_')   // Replace parentheses with placeholders
      .replace(/\)/g, '_RP_')
      .replace(/=/g, '_EQ_')    // Replace equals sign with placeholder
      .replace(/&/g, '_AMP_')   // Replace ampersand with placeholder
      .replace(/_LB_/g, '&#91;') // Convert back to HTML entities
      .replace(/_RB_/g, '&#93;')
      .replace(/_LC_/g, '&#123;')
      .replace(/_RC_/g, '&#125;')
      .replace(/_LP_/g, '&#40;')
      .replace(/_RP_/g, '&#41;')
      .replace(/_EQ_/g, '&#61;')
      .replace(/_AMP_/g, '&#38;');
  }

  /**
   * Truncate selector for display in diagram
   */
  private static truncateSelector(selector: string): string {
    if (selector.length > 25) {
      return selector.substring(0, 25) + '...';
    }
    return selector;
  }

  /**
   * Truncate refinement reason for display
   */
  private static truncateReason(reason: string): string {
    if (reason.length > 30) {
      return reason.substring(0, 30) + '...';
    }
    return reason;
  }

  /**
   * Generate PlantUML sequence diagram
   */
  static generatePlantUMLSequence(sessionLog: ExecutionSessionLog): string {
    let plantuml = '@startuml\n';
    plantuml += 'title Execution Sequence Diagram\\n' + sessionLog.instruction + '\n\n';
    plantuml += 'actor User\n';
    plantuml += 'participant "Browser" as B\n';
    plantuml += 'participant "Action Engine" as AE\n';
    plantuml += 'participant "Page" as P\n\n';
    
    plantuml += 'User -> AE: Execute instruction\n';
    plantuml += 'activate AE\n\n';
    
    sessionLog.entries.forEach((entry, index) => {
      const stepNum = index + 1;
      const success = entry.result.success ? 'SUCCESS' : 'FAILED';
      const color = entry.result.success ? 'green' : 'red';
      
      plantuml += `AE -> B: Step ${stepNum}: ${entry.step.type.toUpperCase()}\n`;
      plantuml += `note right: ${entry.step.description}\n`;
      plantuml += `B -> P: ${entry.step.target?.selector || 'N/A'}\n`;
      plantuml += `P --> B: <color:${color}>${success}</color>\n`;
      plantuml += `B --> AE: Result (${entry.result.executionTimeMs}ms)\n\n`;
    });
    
    plantuml += 'AE --> User: Execution completed\n';
    plantuml += 'deactivate AE\n';
    plantuml += '@enduml';
    
    return plantuml;
  }

  private static createHTMLContent(sessionLog: ExecutionSessionLog): string {
    const mermaidDiagram = this.generateMermaidDiagram(sessionLog);
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Execution Report - ${sessionLog.sessionId}</title>
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .header .meta {
            margin-top: 10px;
            opacity: 0.9;
        }
        .content {
            padding: 30px;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
        }
        .stat-label {
            color: #7f8c8d;
            font-size: 14px;
            margin-top: 5px;
        }
        .diagram-section {
            margin: 30px 0;
        }
        .diagram-container {
            background: white;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .steps-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        .steps-table th,
        .steps-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e9ecef;
        }
        .steps-table th {
            background-color: #f8f9fa;
            font-weight: 600;
        }
        .success {
            color: #28a745;
            font-weight: bold;
        }
        .failed {
            color: #dc3545;
            font-weight: bold;
        }
        .refined {
            background-color: #fff3cd;
            border-left: 3px solid #856404;
        }
        .screenshot-link {
            color: #667eea;
            text-decoration: none;
            font-size: 12px;
        }
        .screenshot-link:hover {
            text-decoration: underline;
        }
        .instruction-box {
            background: #e7f3ff;
            border: 1px solid #b3d7ff;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            font-style: italic;
        }
        .section-title {
            font-size: 20px;
            font-weight: 600;
            margin: 30px 0 15px 0;
            color: #2c3e50;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 Execution Report</h1>
            <div class="meta">
                <div><strong>Session ID:</strong> ${sessionLog.sessionId}</div>
                <div><strong>Started:</strong> ${new Date(sessionLog.startTime).toLocaleString()}</div>
                <div><strong>Duration:</strong> ${(sessionLog.totalDuration / 1000).toFixed(2)}s</div>
            </div>
        </div>
        
        <div class="content">
            <div class="instruction-box">
                <strong>📋 Instruction:</strong> ${sessionLog.instruction}
            </div>
            
            <div class="stats">
                <div class="stat-card">
                    <div class="stat-value">${sessionLog.successfulSteps}/${sessionLog.totalSteps}</div>
                    <div class="stat-label">Steps Completed</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${(sessionLog.summary.successRate * 100).toFixed(1)}%</div>
                    <div class="stat-label">Success Rate</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${sessionLog.entries.filter(e => e.refinement?.wasRefined).length}</div>
                    <div class="stat-label">Refined Steps</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${sessionLog.summary.averageStepTime.toFixed(0)}ms</div>
                    <div class="stat-label">Avg Step Time</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${(sessionLog.totalDuration / 1000).toFixed(1)}s</div>
                    <div class="stat-label">Total Duration</div>
                </div>
            </div>
            
            <div class="section-title">📊 Execution Flow Diagram</div>
            <div class="diagram-container">
                <div class="mermaid">
${mermaidDiagram}
                </div>
            </div>
            
            <div class="section-title">📝 Step Details</div>
            <table class="steps-table">
                <thead>
                    <tr>
                        <th>Step</th>
                        <th>Type</th>
                        <th>Description</th>
                        <th>Selector</th>
                        <th>Refined</th>
                        <th>Result</th>
                        <th>Time</th>
                        <th>Screenshot</th>
                    </tr>
                </thead>
                <tbody>
                    ${sessionLog.entries.map((entry, index) => {
                      const wasRefined = entry.refinement?.wasRefined || false;
                      let refinementInfo = 'No';
                      
                      if (wasRefined) {
                        const originalSelector = entry.refinement?.originalStep?.selector || 'N/A';
                        const refinedSelector = entry.step.target?.selector || 'N/A';
                        const reason = entry.refinement?.refinementReason || 'Context improvement';
                        
                        if (originalSelector !== refinedSelector) {
                          refinementInfo = `🔄 Yes<br/>
                            <details style="margin-top: 5px;">
                              <summary style="cursor: pointer; color: #856404;">View Details</summary>
                              <div style="margin-top: 5px; font-size: 11px;">
                                <strong>Original:</strong><br/><code style="background: #f8f9fa; padding: 2px;">${originalSelector}</code><br/>
                                <strong>Refined:</strong><br/><code style="background: #e8f5e8; padding: 2px;">${refinedSelector}</code><br/>
                                <strong>Reason:</strong> ${reason}
                              </div>
                            </details>`;
                        } else {
                          refinementInfo = `🔄 Yes<br/><small style="color: #856404;">${reason}</small>`;
                        }
                      }
                      
                      return `
                    <tr class="${wasRefined ? 'refined' : ''}">
                        <td>${entry.stepIndex}</td>
                        <td><code>${entry.step.type}</code></td>
                        <td>${entry.step.description}</td>
                        <td><code>${entry.step.target?.selector || 'N/A'}</code></td>
                        <td>${refinementInfo}</td>
                        <td class="${entry.result.success ? 'success' : 'failed'}">
                            ${entry.result.success ? '✅ Success' : '❌ Failed'}
                        </td>
                        <td>${entry.result.executionTimeMs}ms</td>
                        <td>
                            ${entry.screenshot ? 
                                `<a href="${entry.screenshot.path}" class="screenshot-link" target="_blank">📸 View</a>` : 
                                'N/A'
                            }
                        </td>
                    </tr>
                    `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    </div>
    
    <script>
        mermaid.initialize({ 
            startOnLoad: true,
            theme: 'default',
            themeVariables: {
                primaryColor: '#667eea',
                primaryTextColor: '#2c3e50',
                primaryBorderColor: '#667eea',
                lineColor: '#667eea'
            }
        });
    </script>
</body>
</html>`;
  }
}
