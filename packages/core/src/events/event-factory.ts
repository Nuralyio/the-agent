/**
 * EventFactory: Utility for creating execution event objects for agent workflows.
 */
import { ActionStep } from '../types';
import { ExecutionEvent } from './streaming.types';


export class EventFactory {
  static createPlanCreatedEvent(
    sessionId: string,
    totalSteps: number,
    steps?: ActionStep[]
  ): ExecutionEvent {
    const event: ExecutionEvent = {
      type: 'plan_created',
      totalSteps,
      sessionId,
      timestamp: new Date()
    };

    if (steps) {
      event.steps = steps;
    }

    return event;
  }

  static createExecutionPlanCreatedEvent(
    sessionId: string,
    executionPlan: any,
    globalObjective: string,
    planningStrategy?: string
  ): ExecutionEvent {
    return {
      type: 'execution_plan_created',
      executionPlan,
      globalObjective,
      planningStrategy,
      sessionId,
      timestamp: new Date()
    };
  }

  static createStepStartEvent(
    sessionId: string,
    stepIndex: number,
    step: ActionStep,
    subPlanIndex?: number
  ): ExecutionEvent {
    const event: ExecutionEvent = {
      type: 'step_start',
      stepIndex,
      step,
      sessionId,
      timestamp: new Date()
    };

    if (subPlanIndex !== undefined) {
      event.subPlanIndex = subPlanIndex;
    }

    return event;
  }


  static createStepCompleteEvent(
    sessionId: string,
    stepIndex: number,
    step: ActionStep,
    screenshot?: Buffer,
    subPlanIndex?: number
  ): ExecutionEvent {
    const event: ExecutionEvent = {
      type: 'step_complete',
      stepIndex,
      step,
      sessionId,
      timestamp: new Date()
    };

    if (subPlanIndex !== undefined) {
      event.subPlanIndex = subPlanIndex;
    }

    if (screenshot) {
      event.screenshot = screenshot.toString('base64');
    }

    return event;
  }

  static createStepErrorEvent(
    sessionId: string,
    stepIndex: number,
    step: ActionStep,
    error: string,
    subPlanIndex?: number
  ): ExecutionEvent {
    const event: ExecutionEvent = {
      type: 'step_error',
      stepIndex,
      step,
      error,
      sessionId,
      timestamp: new Date()
    };

    if (subPlanIndex !== undefined) {
      event.subPlanIndex = subPlanIndex;
    }

    return event;
  }


  static createPageChangeEvent(
    sessionId: string,
    url: string,
    title: string,
    screenshot?: Buffer
  ): ExecutionEvent {
    const event: ExecutionEvent = {
      type: 'page_change',
      url,
      title,
      sessionId,
      timestamp: new Date()
    };

    if (screenshot) {
      event.screenshot = screenshot.toString('base64');
    }

    return event;
  }


  static createExecutionCompleteEvent(sessionId: string): ExecutionEvent {
    return {
      type: 'execution_complete',
      sessionId,
      timestamp: new Date()
    };
  }


  static createSubPlanStartEvent(
    sessionId: string,
    subPlanIndex: number,
    subPlan: any
  ): ExecutionEvent {
    return {
      type: 'sub_plan_start',
      subPlanIndex,
      subPlan,
      sessionId,
      timestamp: new Date()
    };
  }


  static createSubPlanCompleteEvent(
    sessionId: string,
    subPlanIndex: number,
    subPlan: any,
    success: boolean = true,
    totalSubPlans?: number
  ): ExecutionEvent {
    const event: ExecutionEvent = {
      type: 'sub_plan_completed',
      subPlanIndex,
      subPlan,
      success,
      sessionId,
      timestamp: new Date()
    };

    if (totalSubPlans !== undefined) {
      (event as any).totalSubPlans = totalSubPlans;
    }

    if (!success) {
      event.error = 'Sub-plan execution failed';
    }

    return event;
  }
}
