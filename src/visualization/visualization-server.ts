import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { executionStream } from './execution-stream';

/**
 * VisualizationServer - HTTP server for web-based execution visualization
 */
export class VisualizationServer {
  private app: express.Application;
  private server: any;
  private port: number;

  constructor(port: number = 3002) {
    this.port = port;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Enable CORS for web integration
    this.app.use(cors({
      origin: '*',
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      credentials: false
    }));

    this.app.use(express.json());
    this.app.use(express.static('public'));
  }

  private setupRoutes(): void {
    // Server-Sent Events endpoint for real-time streaming
    this.app.get('/api/execution/stream', (req, res) => {
      const clientId = uuidv4();
      
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      // Add client to stream
      executionStream.addClient(clientId, res);

      // Handle client disconnect
      req.on('close', () => {
        executionStream.removeClient(clientId);
      });

      req.on('aborted', () => {
        executionStream.removeClient(clientId);
      });
    });

    // REST API for execution status
    this.app.get('/api/execution/status', (req, res) => {
      const status = executionStream.getExecutionStatus();
      res.json({
        success: true,
        data: status
      });
    });

    // REST API for execution history
    this.app.get('/api/execution/history', (req, res) => {
      const history = executionStream.getExecutionHistory();
      res.json({
        success: true,
        data: history
      });
    });

    // Demo page endpoint
    this.app.get('/demo', (req, res) => {
      res.send(this.generateDemoPage());
    });

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        activeClients: executionStream.getExecutionStatus().connectedClients
      });
    });
  }

  /**
   * Start the visualization server
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, () => {
        console.log(`🌐 Visualization server running on http://localhost:${this.port}`);
        console.log(`📺 Demo page: http://localhost:${this.port}/demo`);
        console.log(`🔗 Stream endpoint: http://localhost:${this.port}/api/execution/stream`);
        resolve();
      }).on('error', reject);
    });
  }

  /**
   * Stop the visualization server
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log(`🛑 Visualization server stopped`);
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Get the server URL for integration
   */
  getServerUrl(): string {
    return `http://localhost:${this.port}`;
  }

  /**
   * Generate demo HTML page for testing
   */
  private generateDemoPage(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Browser Automation - Live Execution</title>
    <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
            background: #f8fafc;
            min-height: 100vh;
            color: #1a202c;
        }
        .container {
            display: flex;
            height: 100vh;
            max-width: none;
            margin: 0;
            background: white;
            border-radius: 0;
            box-shadow: none;
            overflow: hidden;
        }
        .sidebar {
            width: 380px;
            background: white;
            border-right: 1px solid #e2e8f0;
            display: flex;
            flex-direction: column;
            height: 100vh;
        }
        .sidebar-header {
            background: white;
            color: #1a202c;
            padding: 24px;
            border-bottom: 1px solid #e2e8f0;
        }
        .sidebar-header h1 { 
            font-size: 1.5rem; 
            font-weight: 600; 
            margin-bottom: 4px;
            color: #1a202c;
        }
        .sidebar-header p { 
            color: #64748b; 
            font-size: 0.875rem; 
            font-weight: 400;
        }
        .main-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        .visualizer-header {
            background: white;
            padding: 16px 24px;
            border-bottom: 1px solid #e2e8f0;
        }
        .preview-section {
            flex: 1;
            background: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 32px;
            overflow: hidden;
        }
        .status-section {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
        }
        .connection-status {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .connection-status h3 {
            font-size: 0.875rem;
            font-weight: 500;
            color: #374151;
            margin: 0;
        }
        .status-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #ef4444;
            animation: pulse 2s infinite;
        }
        .status-indicator.connected { background: #10b981; }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        .stats {
            display: flex;
            gap: 32px;
            align-items: center;
        }
        .stat {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .stat-value {
            font-size: 1.125rem;
            font-weight: 600;
            color: #1a202c;
            line-height: 1;
        }
        .stat-label {
            font-size: 0.75rem;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .replay-button {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s ease;
        }
        .replay-button:hover {
            background: #2563eb;
            transform: translateY(-1px);
        }
        .replay-button:disabled {
            background: #d1d5db;
            cursor: not-allowed;
            transform: none;
        }
        .progress-section {
            margin-bottom: 16px;
        }
        .progress-bar {
            background: #e2e8f0;
            border-radius: 4px;
            height: 3px;
            overflow: hidden;
        }
        .progress-fill {
            height: 100%;
            background: #3b82f6;
            transition: width 0.3s ease;
            border-radius: 4px;
        }
        .steps-section {
            flex: 1;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        .steps-header {
            padding: 16px 24px 8px;
            background: white;
        }
        .steps-header h3 {
            font-size: 0.875rem;
            font-weight: 500;
            color: #374151;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0;
        }
        .step-list {
            flex: 1;
            overflow-y: auto;
            padding: 0;
            background: white;
        }
        .step-item {
            padding: 12px 24px;
            border-bottom: 1px solid #f1f5f9;
            transition: all 0.2s ease;
            position: relative;
        }
        .step-item:last-child {
            border-bottom: none;
        }
        .step-item.clickable {
            cursor: pointer;
        }
        .step-item.clickable:hover {
            background: #f8fafc;
        }
        .step-item.active { 
            background: #eff6ff; 
            border-left: 3px solid #3b82f6;
            padding-left: 21px;
        }
        .step-item.completed { 
            background: #f0fdf4; 
            border-left: 3px solid #10b981;
            padding-left: 21px;
        }
        .step-item.error { 
            background: #fef2f2; 
            border-left: 3px solid #ef4444;
            padding-left: 21px;
        }
        .step-item.selected { 
            background: #faf5ff; 
            border-left: 3px solid #8b5cf6;
            padding-left: 21px;
        }
        .step-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 4px;
        }
        .step-type {
            background: #f1f5f9;
            color: #374151;
            padding: 2px 6px;
            border-radius: 12px;
            font-size: 0.6rem;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .step-number {
            font-size: 0.75rem; 
            color: #64748b;
            font-weight: 500;
        }
        .step-description { 
            color: #374151; 
            font-size: 0.875rem; 
            line-height: 1.4;
            margin-bottom: 2px;
        }
        .step-meta {
            font-size: 0.75rem; 
            color: #8b5cf6; 
            display: flex;
            align-items: center;
            gap: 4px;
        }
                .preview-container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            max-width: 100%;
            max-height: 90vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .screenshot {
            max-width: 100%;
            max-height: 100%;
            border-radius: 8px;
            display: block;
        }
        .empty-state {
            text-align: center;
            color: #64748b;
            padding: 64px 32px;
        }
        .empty-state-icon {
            font-size: 3rem;
            margin-bottom: 16px;
            opacity: 0.5;
        }
        .empty-state p {
            font-size: 0.875rem;
            color: #64748b;
        }
    </style>
</head>
<body>
        <div class="container">
        <div class="sidebar">
            <div class="sidebar-header">
                <h1>Execution Steps</h1>
                <p>Click any step to view screenshot</p>
            </div>
            
            <div class="steps-section">
                <div class="step-list" id="step-list">
                    <div class="empty-state">
                        <div class="empty-state-icon">⏳</div>
                        <p>Waiting for execution to start...</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="main-content">
            <div class="visualizer-header">
                <div class="status-section">
                    <div class="connection-status">
                        <span class="status-indicator" id="connection-status"></span>
                        <h3>Browser Automation</h3>
                    </div>
                    
                    <div class="stats">
                        <div class="stat">
                            <div class="stat-value" id="total-steps">0</div>
                            <div class="stat-label">Steps</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value" id="completed-steps">0</div>
                            <div class="stat-label">Done</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value" id="current-step">-</div>
                            <div class="stat-label">Current</div>
                        </div>
                        <button class="replay-button" id="replay-button" disabled>
                            <span>🔄</span>
                            <span>Replay</span>
                        </button>
                    </div>
                </div>
                
                <div class="progress-section">
                    <div class="progress-bar">
                        <div class="progress-fill" id="progress-fill" style="width: 0%"></div>
                    </div>
                </div>
            </div>
            
            <div class="preview-section">
                <div class="preview-container" id="screenshot-container">
                    <div class="empty-state">
                        <div class="empty-state-icon">📱</div>
                        <p>Live preview will appear here</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        class ExecutionVisualizer {
            constructor() {
                this.eventSource = null;
                this.steps = new Map();
                this.stepScreenshots = new Map(); // Store screenshots for each step
                this.selectedStepIndex = null; // Track selected step
                this.totalSteps = 0;
                this.completedSteps = 0;
                this.currentStep = 0;
                this.isConnected = false;
                this.isReplaying = false;
                this.replayInterval = null;
                
                this.initializeElements();
                this.connect();
                this.setupReplayButton();
            }
            
            initializeElements() {
                this.elements = {
                    connectionStatus: document.getElementById('connection-status'),
                    totalSteps: document.getElementById('total-steps'),
                    completedSteps: document.getElementById('completed-steps'),
                    currentStep: document.getElementById('current-step'),
                    progressFill: document.getElementById('progress-fill'),
                    stepList: document.getElementById('step-list'),
                    screenshotContainer: document.getElementById('screenshot-container'),
                    replayButton: document.getElementById('replay-button')
                };
            }
            
            connect() {
                console.log('🔌 Connecting to execution stream...');
                
                this.eventSource = new EventSource('/api/execution/stream');
                
                this.eventSource.onopen = () => {
                    console.log('✅ Connected to execution stream');
                    this.updateConnectionStatus(true);
                };
                
                this.eventSource.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        this.handleMessage(message);
                    } catch (error) {
                        console.error('Failed to parse message:', error);
                    }
                };
                
                this.eventSource.onerror = (error) => {
                    console.error('❌ EventSource error:', error);
                    this.updateConnectionStatus(false);
                    
                    // Reconnect after 3 seconds
                    setTimeout(() => this.connect(), 3000);
                };
            }
            
            handleMessage(message) {
                switch (message.type) {
                    case 'connection':
                        console.log('🎉 Connection confirmed:', message.data.clientId);
                        break;
                        
                    case 'history':
                        console.log('📜 Received execution history');
                        message.data.forEach(event => this.handleExecutionEvent(event));
                        break;
                        
                    case 'execution_event':
                        this.handleExecutionEvent(message.data);
                        break;
                }
            }
            
            handleExecutionEvent(event) {
                console.log('📡 Execution event:', event.type, event);
                
                switch (event.type) {
                    case 'plan_created':
                        this.handlePlanCreated(event);
                        break;
                        
                    case 'step_start':
                        this.handleStepStart(event);
                        break;
                        
                    case 'step_complete':
                        this.handleStepComplete(event);
                        break;
                        
                    case 'step_error':
                        this.handleStepError(event);
                        break;
                        
                    case 'page_change':
                        this.handlePageChange(event);
                        break;
                        
                    case 'execution_complete':
                        this.handleExecutionComplete(event);
                        break;
                }
            }
            
            handlePlanCreated(event) {
                console.log('📋 Plan created with', event.totalSteps, 'steps');
                this.totalSteps = event.totalSteps || 0;
                this.currentStep = 0;
                this.completedSteps = 0;
                this.steps.clear();
                
                this.updateStats();
                this.renderSteps();
            }
            
            handleStepStart(event) {
                const step = {
                    ...event.step,
                    index: event.stepIndex,
                    status: 'active',
                    startTime: event.timestamp
                };
                
                this.steps.set(event.stepIndex, step);
                this.currentStep = event.stepIndex + 1;
                
                this.updateStats();
                this.updateReplayButtonState();
                this.renderSteps();
            }
            
            handleStepComplete(event) {
                const step = this.steps.get(event.stepIndex);
                if (step) {
                    step.status = 'completed';
                    step.endTime = event.timestamp;
                    this.completedSteps++;
                    
                    if (event.screenshot) {
                        // Store screenshot for this step
                        this.stepScreenshots.set(event.stepIndex, event.screenshot);
                        step.hasScreenshot = true;
                        
                        // Update main screenshot display
                        this.updateScreenshot(event.screenshot);
                    }
                    
                    this.updateStats();
                    this.updateReplayButtonState();
                    this.renderSteps();
                }
            }
            
            handleStepError(event) {
                const step = this.steps.get(event.stepIndex);
                if (step) {
                    step.status = 'error';
                    step.error = event.error;
                    step.endTime = event.timestamp;
                    
                    this.updateStats();
                    this.renderSteps();
                }
            }
            
            handlePageChange(event) {
                if (event.screenshot) {
                    // Store screenshot for current step if we have one active
                    if (this.currentStep > 0) {
                        const stepIndex = this.currentStep - 1;
                        this.stepScreenshots.set(stepIndex, event.screenshot);
                        
                        const step = this.steps.get(stepIndex);
                        if (step) {
                            step.hasScreenshot = true;
                        }
                    }
                    
                    this.updateScreenshot(event.screenshot);
                    this.renderSteps(); // Re-render to show screenshot indicators
                }
            }
            
            handleExecutionComplete(event) {
                console.log('🏁 Execution completed');
                this.currentStep = 0;
            }
            
            updateConnectionStatus(connected) {
                this.isConnected = connected;
                this.elements.connectionStatus.className = 
                    \`status-indicator \${connected ? 'connected' : ''}\`;
            }
            
            updateStats() {
                this.elements.totalSteps.textContent = this.totalSteps;
                this.elements.completedSteps.textContent = this.completedSteps;
                this.elements.currentStep.textContent = this.currentStep || '-';
                
                const progress = this.totalSteps > 0 ? 
                    (this.completedSteps / this.totalSteps) * 100 : 0;
                this.elements.progressFill.style.width = \`\${progress}%\`;
            }
            
            renderSteps() {
                if (this.steps.size === 0) {
                    this.elements.stepList.innerHTML = \`
                        <div class="empty-state">
                            <div class="empty-state-icon">⏳</div>
                            <p>Waiting for execution to start...</p>
                        </div>\`;
                    return;
                }
                
                const stepsArray = Array.from(this.steps.values())
                    .sort((a, b) => a.index - b.index);
                
                this.elements.stepList.innerHTML = stepsArray
                    .map(step => this.renderStep(step))
                    .join('');
                
                // Add click handlers to steps
                this.elements.stepList.querySelectorAll('.step-item').forEach((stepElement, index) => {
                    const step = stepsArray[index];
                    if (step && step.hasScreenshot) {
                        stepElement.addEventListener('click', () => this.selectStep(step.index));
                    }
                });
            }
            
            renderStep(step) {
                const statusClass = step.status;
                const isSelected = this.selectedStepIndex === step.index;
                const isClickable = step.hasScreenshot;
                const clickableClass = isClickable ? 'clickable' : '';
                const selectedClass = isSelected ? 'selected' : '';
                
                return \`
                    <div class="step-item \${statusClass} \${clickableClass} \${selectedClass}">
                        <div class="step-header">
                            <span class="step-type">\${step.type}</span>
                            <span class="step-number">Step \${step.index + 1}</span>
                        </div>
                        <div class="step-description">\${step.description}</div>
                        \${isClickable ? '<div class="step-meta">📷 Click to view</div>' : ''}
                        \${step.error ? \`<div style="color: #ef4444; font-size: 0.75rem; margin-top: 4px;">\${step.error}</div>\` : ''}
                    </div>
                \`;
            }
            
            selectStep(stepIndex) {
                this.selectedStepIndex = stepIndex;
                const screenshot = this.stepScreenshots.get(stepIndex);
                
                if (screenshot) {
                    this.updateScreenshot(screenshot);
                }
                
                // Re-render steps to update selection
                this.renderSteps();
            }
            
            updateScreenshot(base64Screenshot) {
                this.elements.screenshotContainer.innerHTML = \`
                    <img src="data:image/png;base64,\${base64Screenshot}" 
                         alt="Live browser preview" 
                         class="screenshot">
                \`;
            }
            
            setupReplayButton() {
                this.elements.replayButton.addEventListener('click', () => {
                    if (this.isReplaying) {
                        this.stopReplay();
                    } else {
                        this.startReplay();
                    }
                });
            }
            
            startReplay() {
                const screenshotSteps = Array.from(this.steps.values())
                    .filter(step => step.hasScreenshot)
                    .sort((a, b) => a.index - b.index);
                
                if (screenshotSteps.length === 0) return;
                
                this.isReplaying = true;
                this.elements.replayButton.innerHTML = '<span>⏸️</span><span>Stop</span>';
                
                let currentIndex = 0;
                
                const showNextScreenshot = () => {
                    if (!this.isReplaying || currentIndex >= screenshotSteps.length) {
                        this.stopReplay();
                        return;
                    }
                    
                    const step = screenshotSteps[currentIndex];
                    const screenshot = this.stepScreenshots.get(step.index);
                    
                    if (screenshot) {
                        this.updateScreenshot(screenshot);
                        this.selectedStepIndex = step.index;
                        this.renderSteps(); // Update step selection
                    }
                    
                    currentIndex++;
                    
                    if (currentIndex >= screenshotSteps.length) {
                        // Loop back to start
                        currentIndex = 0;
                    }
                };
                
                // Show first screenshot immediately
                showNextScreenshot();
                
                // Then continue with interval
                this.replayInterval = setInterval(showNextScreenshot, 2000); // 2 seconds between screenshots
            }
            
            stopReplay() {
                this.isReplaying = false;
                this.elements.replayButton.innerHTML = '<span>🔄</span><span>Replay</span>';
                
                if (this.replayInterval) {
                    clearInterval(this.replayInterval);
                    this.replayInterval = null;
                }
            }
            
            updateReplayButtonState() {
                const hasScreenshots = Array.from(this.steps.values()).some(step => step.hasScreenshot);
                this.elements.replayButton.disabled = !hasScreenshots;
            }
        }
        
        // Initialize the visualizer when page loads
        document.addEventListener('DOMContentLoaded', () => {
            new ExecutionVisualizer();
        });
    </script>
</body>
</html>
    `;
  }
}

// Global singleton instance
export const visualizationServer = new VisualizationServer();
