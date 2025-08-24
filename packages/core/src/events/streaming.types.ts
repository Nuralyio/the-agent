import { ActionStep } from '../engine/planning/types/types';

/**
 * Event type definitions for execution streaming
 */
export type ExecutionEventType =
  | 'plan_created'
  | 'execution_plan_created'
  | 'sub_plan_start'
  | 'sub_plan_completed'
  | 'step_start'
  | 'step_complete'
  | 'step_error'
  | 'screenshot'
  | 'page_change'
  | 'execution_complete';

/**
 * Base execution event interface
 */
export interface ExecutionEvent {
  type: ExecutionEventType;
  stepIndex?: number;
  step?: ActionStep;
  steps?: ActionStep[];
  totalSteps?: number;
  screenshot?: string; // Base64 encoded
  url?: string;
  title?: string;
  error?: string;
  success?: boolean; // For sub-plan completion status
  timestamp: Date;
  sessionId: string;
  // Execution plan specific fields
  executionPlan?: any;
  globalObjective?: string;
  planningStrategy?: string;
  // Sub-plan specific fields
  subPlanIndex?: number;
  subPlan?: any;
}

/**
 * Stream client representation
 */
export interface StreamClient {
  id: string;
  response: any; // HTTP response object
  lastPing: Date;
  connectionTime: Date;
  sessionId?: string;
}

/**
 * Execution status information
 */
export interface ExecutionStatus {
  sessionId: string | null;
  isActive: boolean;
  totalEvents: number;
  connectedClients: number;
  lastEvent?: ExecutionEvent;
}

/**
 * Message sent to clients
 */
export interface StreamMessage {
  type: 'execution_event' | 'connection' | 'history';
  data: any;
}

/**
 * Execution session data interface
 */
export interface ExecutionSessionData {
  id: string;
  status: 'active' | 'completed' | 'error';
  startTime: Date;
  endTime?: Date;
  events: ExecutionEvent[];
  lastActivity: Date;
}
