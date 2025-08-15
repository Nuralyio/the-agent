// API utility functions for communicating with the monitor server
export interface AutomationServerConfig {
  baseUrl: string;
  timeout?: number;
}

export interface TaskExecutionRequest {
  instruction: string;
  options?: {
    headless?: boolean;
    browserType?: string;
    timeout?: number;
  };
}

export interface TaskExecutionResponse {
  success: boolean;
  sessionId: string;
  message?: string;
  error?: string;
}

export interface ServerStatusResponse {
  success: boolean;
  data: {
    serverStatus: string;
    connectedClients: number;
    currentSession?: {
      sessionId: string;
      startTime: string;
      totalSteps: number;
      completedSteps: number;
      status: string;
    };
    totalSessions: number;
    totalMessages: number;
  };
}

export class AutomationAPI {
  private config: AutomationServerConfig;

  constructor(config: AutomationServerConfig) {
    this.config = {
      timeout: 30000,
      ...config,
    };
  }

  async executeTask(request: TaskExecutionRequest): Promise<TaskExecutionResponse> {
    const response = await fetch(`${this.config.baseUrl}/api/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(this.config.timeout!),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  async getServerStatus(): Promise<ServerStatusResponse> {
    const response = await fetch(`${this.config.baseUrl}/api/status`, {
      method: 'GET',
      signal: AbortSignal.timeout(this.config.timeout!),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  async getSessions(): Promise<any> {
    const response = await fetch(`${this.config.baseUrl}/api/sessions`, {
      method: 'GET',
      signal: AbortSignal.timeout(this.config.timeout!),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  async getSessionDetails(sessionId: string): Promise<any> {
    const response = await fetch(`${this.config.baseUrl}/api/sessions/${sessionId}`, {
      method: 'GET',
      signal: AbortSignal.timeout(this.config.timeout!),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  async getStepScreenshot(sessionId: string, stepIndex: number): Promise<any> {
    const response = await fetch(
      `${this.config.baseUrl}/api/sessions/${sessionId}/steps/${stepIndex}/screenshot`,
      {
        method: 'GET',
        signal: AbortSignal.timeout(this.config.timeout!),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  createEventSource(path: string = '/api/execution/stream'): EventSource {
    return new EventSource(`${this.config.baseUrl}${path}`);
  }
}

export const automationAPI = new AutomationAPI({
  baseUrl: 'http://localhost:3002',
});

// Quick execution helpers
export async function quickExecute(instruction: string): Promise<TaskExecutionResponse> {
  return automationAPI.executeTask({
    instruction,
    options: {
      headless: true,
      browserType: 'chromium',
      timeout: 30000,
    },
  });
}

export async function quickStatus(): Promise<ServerStatusResponse> {
  return automationAPI.getServerStatus();
}
