import { AUTOMATION_SERVER_URL } from './constants';

export interface ExecuteTaskRequest {
  taskDescription: string;
  engine: string;
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

export const connectToEventStream = (): EventSource => {
  return new EventSource(`${AUTOMATION_SERVER_URL}/api/execution/stream`);
};
