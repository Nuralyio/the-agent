import { ActionStep } from '../types';
import { ExecutionEvent } from './streaming.types';

/**
 * Factory for creating different types of execution events
 */
export class EventFactory {
  /**
   * Create plan created event
   */
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

  /**
   * Create plan created event
   */
  static createHierarchicalPlanCreatedEvent(
    sessionId: string,
    hierarchicalPlan: any,
    globalObjective: string,
    planningStrategy?: string
  ): ExecutionEvent {
    return {
      type: 'hierarchical_plan_created',
      hierarchicalPlan,
      globalObjective,
      planningStrategy,
      sessionId,
      timestamp: new Date()
    };
  }

  /**
   * Create step start event
   */
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

  /**
   * Create step complete event
   */
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

  /**
   * Create step error event
   */
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

  /**
   * Create page change event
   */
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

  /**
   * Create execution complete event
   */
  static createExecutionCompleteEvent(sessionId: string): ExecutionEvent {
    return {
      type: 'execution_complete',
      sessionId,
      timestamp: new Date()
    };
  }

  /**
   * Create sub-plan start event
   */
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

  /**
   * Create sub-plan complete event
   */
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

    // Add total sub-plans count if provided
    if (totalSubPlans !== undefined) {
      (event as any).totalSubPlans = totalSubPlans;
    }

    // Add error property if sub-plan failed
    if (!success) {
      event.error = 'Sub-plan execution failed';
    }

    return event;
  }
}
