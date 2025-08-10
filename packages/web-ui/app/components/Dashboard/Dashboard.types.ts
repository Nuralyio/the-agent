export interface ChatMessage {
  id: number;
  type: 'user' | 'system' | 'step' | 'plan';
  text: string;
  timestamp: Date;
  description?: string;
  status?: string;
  steps?: ExecutionStep[];
}

export interface ExecutionStep {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  timestamp?: Date;
  screenshot?: string;
}

export interface TabItem {
  id: string;
  label: string;
}

export interface AutomationSettings {
  engine: string;
  timeout: number;
  browserMode: 'headless' | 'headed';
  viewportSize: string;
  userAgent: string;
}
