// Streaming and event-related types

export interface ExecutionEvent {
  type: 'plan_created' | 'step_start' | 'step_complete' | 'step_error' | 'screenshot' | 'page_change' | 'execution_complete';
  stepIndex?: number;
  step?: any; // ActionStep from actions.ts
  steps?: any[]; // ActionStep[] from actions.ts
  totalSteps?: number;
  screenshot?: string; // Base64 encoded
  url?: string;
  title?: string;
  error?: string;
  timestamp: Date;
  sessionId: string;
}

export interface StreamClient {
  id: string;
  response: any; // HTTP response object
  lastPing: Date;
}

export interface StreamingOptions {
  enableHistory?: boolean;
  maxHistorySize?: number;
  clientTimeout?: number;
  cleanupInterval?: number;
}
