import { writeFileSync } from 'fs';
import { join } from 'path';
import { ExecutionSessionLog } from './execution-logger';

/**
 * Format converters for open-source analysis tools
 */
export class ExecutionFormatConverter {
  
  /**
   * Convert to Allure test results format for reporting
   */
  static convertToAllure(sessionLog: ExecutionSessionLog, outputDir?: string): string {
    const allureResult = {
      uuid: sessionLog.sessionId,
      name: sessionLog.instruction,
      fullName: `Automation Session: ${sessionLog.sessionId}`,
      start: new Date(sessionLog.startTime).getTime(),
      stop: new Date(sessionLog.endTime || sessionLog.startTime).getTime(),
      status: sessionLog.success ? 'passed' : 'failed',
      stage: 'finished',
      steps: sessionLog.entries.map((entry, index) => ({
        name: entry.step.description,
        status: entry.result.success ? 'passed' : 'failed',
        start: new Date(entry.timestamp).getTime() - entry.result.executionTimeMs,
        stop: new Date(entry.timestamp).getTime(),
        stage: 'finished',
        parameters: [
          { name: 'Type', value: entry.step.type },
          { name: 'Selector', value: entry.step.target?.selector || 'N/A' },
          ...(entry.step.value ? [{ name: 'Value', value: entry.step.value }] : [])
        ],
        attachments: entry.screenshot ? [{
          name: 'Screenshot',
          source: entry.screenshot.filename,
          type: 'image/png'
        }] : []
      })),
      attachments: [],
      parameters: [
        { name: 'Total Steps', value: sessionLog.totalSteps.toString() },
        { name: 'Success Rate', value: `${(sessionLog.summary.successRate * 100).toFixed(1)}%` },
        { name: 'Average Step Time', value: `${sessionLog.summary.averageStepTime.toFixed(0)}ms` }
      ],
      labels: [
        { name: 'framework', value: 'browser-automation' },
        { name: 'language', value: 'typescript' },
        { name: 'feature', value: 'form-automation' }
      ]
    };

    const fileName = `${sessionLog.sessionId}-result.json`;
    const outputPath = outputDir || join(process.cwd(), 'execution-logs', 'allure-results');
    const filePath = join(outputPath, fileName);
    
    writeFileSync(filePath, JSON.stringify(allureResult, null, 2));
    console.log(`📋 Allure format generated: ${filePath}`);
    
    return filePath;
  }

  /**
   * Convert to CSV format for spreadsheet analysis
   */
  static convertToCSV(sessionLog: ExecutionSessionLog, outputPath?: string): string {
    const headers = [
      'SessionId',
      'StepIndex',
      'Timestamp',
      'Type',
      'Description',
      'Selector',
      'Value',
      'Success',
      'ExecutionTimeMs',
      'ElementFound',
      'SelectorUsed',
      'ValueEntered',
      'PageUrl',
      'PageTitle',
      'ScreenshotPath',
      'PreviousStepsCount',
      'SessionDuration'
    ];

    const rows = sessionLog.entries.map(entry => [
      sessionLog.sessionId,
      entry.stepIndex,
      entry.timestamp,
      entry.step.type,
      `"${entry.step.description.replace(/"/g, '""')}"`,
      `"${entry.step.target?.selector || ''}"`,
      `"${entry.step.value || ''}"`,
      entry.result.success,
      entry.result.executionTimeMs,
      entry.result.elementFound || false,
      `"${entry.result.selectorUsed || ''}"`,
      `"${entry.result.valueEntered || ''}"`,
      `"${entry.page.url}"`,
      `"${entry.page.title}"`,
      `"${entry.screenshot?.path || ''}"`,
      entry.context?.previousStepsCount || 0,
      entry.context?.sessionDuration || 0
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    
    const fileName = `execution-data-${sessionLog.sessionId}.csv`;
    const filePath = outputPath || join(process.cwd(), 'execution-logs', fileName);
    
    writeFileSync(filePath, csvContent);
    console.log(`📊 CSV format generated: ${filePath}`);
    
    return filePath;
  }

  /**
   * Convert to Grafana-compatible JSON format for dashboards
   */
  static convertToGrafana(sessionLog: ExecutionSessionLog, outputPath?: string): string {
    const grafanaData = sessionLog.entries.map(entry => ({
      timestamp: new Date(entry.timestamp).getTime(),
      session_id: sessionLog.sessionId,
      step_index: entry.stepIndex,
      step_type: entry.step.type,
      success: entry.result.success ? 1 : 0,
      execution_time_ms: entry.result.executionTimeMs,
      element_found: entry.result.elementFound ? 1 : 0,
      page_url: entry.page.url,
      selector: entry.step.target?.selector || '',
      description: entry.step.description,
      session_duration: entry.context?.sessionDuration || 0,
      success_rate: sessionLog.summary.successRate,
      avg_step_time: sessionLog.summary.averageStepTime
    }));

    const fileName = `grafana-data-${sessionLog.sessionId}.json`;
    const filePath = outputPath || join(process.cwd(), 'execution-logs', fileName);
    
    writeFileSync(filePath, JSON.stringify(grafanaData, null, 2));
    console.log(`📈 Grafana format generated: ${filePath}`);
    
    return filePath;
  }

  /**
   * Convert to JUnit XML format for CI/CD integration
   */
  static convertToJUnit(sessionLog: ExecutionSessionLog, outputPath?: string): string {
    const testSuiteName = `AutomationSession_${sessionLog.sessionId}`;
    const totalTime = (sessionLog.totalDuration / 1000).toFixed(3);
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<testsuite name="${testSuiteName}" `;
    xml += `tests="${sessionLog.totalSteps}" `;
    xml += `failures="${sessionLog.failedSteps}" `;
    xml += `errors="0" `;
    xml += `time="${totalTime}" `;
    xml += `timestamp="${sessionLog.startTime}">\n`;
    
    xml += `  <properties>\n`;
    xml += `    <property name="instruction" value="${sessionLog.instruction.replace(/"/g, '&quot;')}" />\n`;
    xml += `    <property name="success_rate" value="${(sessionLog.summary.successRate * 100).toFixed(1)}%" />\n`;
    xml += `    <property name="avg_step_time" value="${sessionLog.summary.averageStepTime.toFixed(0)}ms" />\n`;
    xml += `  </properties>\n`;
    
    sessionLog.entries.forEach(entry => {
      const testTime = (entry.result.executionTimeMs / 1000).toFixed(3);
      const className = `Step_${entry.step.type}`;
      const testName = entry.step.description.replace(/[<>&"']/g, '');
      
      xml += `  <testcase classname="${className}" name="${testName}" time="${testTime}"`;
      
      if (!entry.result.success) {
        xml += `>\n`;
        xml += `    <failure message="${entry.result.error || 'Step failed'}" type="StepFailure">\n`;
        xml += `      Selector: ${entry.step.target?.selector || 'N/A'}\n`;
        xml += `      Page: ${entry.page.url}\n`;
        xml += `    </failure>\n`;
        xml += `  </testcase>\n`;
      } else {
        xml += ` />\n`;
      }
    });
    
    xml += `</testsuite>`;
    
    const fileName = `junit-${sessionLog.sessionId}.xml`;
    const filePath = outputPath || join(process.cwd(), 'execution-logs', fileName);
    
    writeFileSync(filePath, xml);
    console.log(`🧪 JUnit format generated: ${filePath}`);
    
    return filePath;
  }

  /**
   * Generate all formats at once
   */
  static generateAllFormats(sessionLog: ExecutionSessionLog, outputDir?: string): {
    html: string;
    csv: string;
    grafana: string;
    junit: string;
    mermaid: string;
    plantuml: string;
  } {
    const baseDir = outputDir || join(process.cwd(), 'execution-logs');
    
    // Import ExecutionVisualizer dynamically to avoid circular dependency
    const ExecutionVisualizer = require('./execution-visualizer').ExecutionVisualizer;
    
    const results = {
      html: ExecutionVisualizer.generateHTMLReport(sessionLog, baseDir),
      csv: this.convertToCSV(sessionLog, join(baseDir, `execution-data-${sessionLog.sessionId}.csv`)),
      grafana: this.convertToGrafana(sessionLog, join(baseDir, `grafana-data-${sessionLog.sessionId}.json`)),
      junit: this.convertToJUnit(sessionLog, join(baseDir, `junit-${sessionLog.sessionId}.xml`)),
      mermaid: this.saveMermaidDiagram(sessionLog, baseDir),
      plantuml: this.savePlantUMLDiagram(sessionLog, baseDir)
    };
    
    console.log(`🎯 All formats generated for session ${sessionLog.sessionId}`);
    return results;
  }

  private static saveMermaidDiagram(sessionLog: ExecutionSessionLog, outputDir: string): string {
    // Import ExecutionVisualizer dynamically
    const ExecutionVisualizer = require('./execution-visualizer').ExecutionVisualizer;
    const mermaidContent = ExecutionVisualizer.generateMermaidDiagram(sessionLog);
    
    const fileName = `mermaid-${sessionLog.sessionId}.md`;
    const filePath = join(outputDir, fileName);
    
    const content = `# Execution Flow Diagram\n\n\`\`\`mermaid\n${mermaidContent}\n\`\`\``;
    
    writeFileSync(filePath, content);
    console.log(`🔄 Mermaid diagram generated: ${filePath}`);
    
    return filePath;
  }

  private static savePlantUMLDiagram(sessionLog: ExecutionSessionLog, outputDir: string): string {
    // Import ExecutionVisualizer dynamically
    const ExecutionVisualizer = require('./execution-visualizer').ExecutionVisualizer;
    const plantumlContent = ExecutionVisualizer.generatePlantUMLSequence(sessionLog);
    
    const fileName = `sequence-${sessionLog.sessionId}.puml`;
    const filePath = join(outputDir, fileName);
    
    writeFileSync(filePath, plantumlContent);
    console.log(`📈 PlantUML diagram generated: ${filePath}`);
    
    return filePath;
  }
}
