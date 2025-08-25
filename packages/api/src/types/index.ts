import { Response } from 'express';

/**
 * Interface for execution stream clients
 */
export interface ExecutionStreamClient {
    response: Response;
}

/**
 * Interface for execution stream with private clients property
 */
export interface ExecutionStreamWithClients {
    clients?: Map<string, ExecutionStreamClient>;
}

/**
 * Interface for automation execution request
 */
export interface AutomationExecuteRequest {
    taskDescription: string;
    engine?: string;
    aiProvider?: string;
    options?: Record<string, unknown>;
}

/**
 * Interface for API response
 */
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    taskId?: string;
    timestamp?: string;
}

/**
 * Interface for execution event
 */
export interface ExecutionEvent {
    type: string;
    sessionId?: string;
    timestamp: string;
    task?: string;
    taskId?: string;
    result?: unknown;
    error?: string;
    status?: string;
}

/**
 * Interface for health check response
 */
export interface HealthCheckResponse {
    status: string;
    timestamp: string;
    activeClients: number;
}
