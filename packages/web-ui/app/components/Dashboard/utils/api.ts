import { AUTOMATION_SERVER_URL } from './constants';

export interface ExecuteTaskRequest {
  taskDescription: string;
  engine: string;
  aiProvider?: string;
  options: {
    headless: boolean;
  };
}

export interface ExecuteTaskResponse {
  success: boolean;
  taskId?: string;
  error?: string;
}

export const executeAutomationTask = async (request: ExecuteTaskRequest): Promise<ExecuteTaskResponse> => {
  const response = await fetch(`${AUTOMATION_SERVER_URL}/api/automation/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  return await response.json();
};

export const connectToEventStream = (taskId?: string): EventSource => {
  const url = taskId 
    ? `${AUTOMATION_SERVER_URL}/api/execution/stream?taskId=${taskId}`
    : `${AUTOMATION_SERVER_URL}/api/execution/stream`;
  return new EventSource(url);
};

export interface ExecutionStatus {
  isRunning: boolean;
  isPaused: boolean;
  hasTaskResult: boolean;
}

export interface ExecutionStatusResponse {
  success: boolean;
  data?: ExecutionStatus;
  error?: string;
}

export const getExecutionStatus = async (): Promise<ExecutionStatusResponse> => {
  const response = await fetch(`${AUTOMATION_SERVER_URL}/api/automation/status`);
  return await response.json();
};
