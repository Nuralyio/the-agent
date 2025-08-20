import type { EventData, UseEventStreamProps } from '../types/eventStream.types';
import {
  completeHierarchicalPlan,
  createMainPlanFromHierarchical,
  updateHierarchicalStepStatus,
  updateSubPlanStatus,
} from '../utils/hierarchicalPlanUtils';
import {
  createErrorMessage,
  createExecutionCompleteMessage,
  createExecutionStartMessage,
  createSubPlanCompletionMessage,
} from '../utils/messageUtils';
import {
  createHierarchicalPlan,
  createHierarchicalPlanMessage,
  createOrExtendPlan,
  createPlanMessage,
  createPlanSteps,
  createStepMessage,
  createSubPlanSteps,
} from '../utils/planUtils';

export class EventHandlers {
  constructor(private props: UseEventStreamProps) { }

  /**
   * Handles execution start events
   */
  handleExecutionStart = (data: EventData): void => {
    if (!data.task) return;

    const message = createExecutionStartMessage(data.task);
    this.props.setChatMessages(prev => [...prev, message]);
  };

  /**
   * Handles plan creation events
   */
  handlePlanCreated = (data: EventData): void => {
    const steps = data.data?.steps || data.steps;
    if (!steps) return;

    const planSteps = createPlanSteps(steps);
    this.props.setCurrentPlan(planSteps);

    // Turn off loading state when regular plan is received
    if (this.props.setIsLoading) {
      this.props.setIsLoading(false);
    }

    const planMessage = createPlanMessage(planSteps);
    this.props.setChatMessages(prev => [...prev, planMessage]);
  };

  /**
   * Handles plan creation events
   */
  handleHierarchicalPlanCreated = (data: EventData): void => {
    const hierarchicalPlan = createHierarchicalPlan(data);

    // Update plan state
    if (this.props.setCurrentHierarchicalPlan) {
      this.props.setCurrentHierarchicalPlan(hierarchicalPlan);
    }

    // Turn off loading state when plan is received
    if (this.props.setIsLoading) {
      this.props.setIsLoading(false);
    }

    // Create sub-plan overview steps for main plan display
    const subPlanSteps = createSubPlanSteps(hierarchicalPlan);
    this.props.setCurrentPlan(subPlanSteps);

    // Add plan message to chat
    const hierarchicalPlanMessage = createHierarchicalPlanMessage(hierarchicalPlan);
    this.props.setChatMessages(prev => [...prev, hierarchicalPlanMessage]);
  };

  /**
   * Handles step start events
   */
  handleStepStart = (data: EventData): void => {
    const stepIndex = data.data?.stepIndex ?? data.stepIndex ?? 0;
    const stepData = data.data?.step || data.step;

    // Update plan step status
    this.props.setCurrentPlan(prev =>
      createOrExtendPlan(prev, stepIndex, stepData, 'running')
    );

    // Update plan step status
    if (this.props.setCurrentHierarchicalPlan) {
      this.props.setCurrentHierarchicalPlan(prev => {
        if (!prev) return prev;
        return updateHierarchicalStepStatus(prev, data, 'running');
      });
    }

    // Add step message to chat
    const stepMessage = createStepMessage(data, 'running');
    this.props.setChatMessages(prev => [...prev, stepMessage]);
  };

  /**
   * Handles step completion events
   */
  handleStepComplete = (data: EventData): void => {
    const stepIndex = data.data?.stepIndex ?? data.stepIndex ?? 0;
    const stepData = data.data?.step || data.step;
    const screenshot = data.data?.screenshot || data.screenshot;

    // Update plan step status
    this.props.setCurrentPlan(prev =>
      createOrExtendPlan(prev, stepIndex, stepData, 'completed', screenshot)
    );

    // Update current screenshot if available
    if (screenshot) {
      this.props.setCurrentScreenshot(`data:image/png;base64,${screenshot}`);
    }

    // Update plan step status
    if (this.props.setCurrentHierarchicalPlan) {
      this.props.setCurrentHierarchicalPlan(prev => {
        if (!prev) return prev;

        const updatedPlan = updateHierarchicalStepStatus(prev, data, 'completed', screenshot);

        // Update main plan display if showing hierarchical view
        this.props.setCurrentPlan(prevPlan => {
          if (prevPlan.length > 0 && prevPlan[0].title?.includes('Sub-plan')) {
            return createMainPlanFromHierarchical(updatedPlan, true);
          }
          return prevPlan;
        });

        return updatedPlan;
      });
    }

    // Update the last step message to completed
    this.props.updateLastStepMessage('completed');
  };

  /**
   * Handles step error events
   */
  handleStepError = (data: EventData): void => {
    const stepIndex = data.stepIndex ?? 0;
    const stepData = data.step;

    // Update plan step status to error
    this.props.setCurrentPlan(prev =>
      createOrExtendPlan(prev, stepIndex, stepData, 'error')
    );
  };

  /**
   * Handles sub-plan start events
   */
  handleSubPlanStart = (data: EventData): void => {
    if (!this.props.setCurrentHierarchicalPlan) return;

    const subPlanIndex = data.data?.subPlanIndex ?? data.subPlanIndex ?? 0;

    this.props.setCurrentHierarchicalPlan(prev => {
      if (!prev) return prev;

      const updatedPlan = updateSubPlanStatus(prev, subPlanIndex, 'running');

      // Update main plan display
      this.props.setCurrentPlan(prevPlan => {
        if (prevPlan.length > 0 && prevPlan[0].title?.includes('Sub-plan')) {
          return createMainPlanFromHierarchical(updatedPlan);
        }
        return prevPlan;
      });

      return updatedPlan;
    });
  };

  /**
   * Handles sub-plan completion events
   */
  handleSubPlanCompleted = (data: EventData): void => {
    const subPlanIndex = data.data?.subPlanIndex ?? data.subPlanIndex ?? 0;
    const success = data.data?.success ?? data.success ?? true;

    if (this.props.setCurrentHierarchicalPlan) {
      this.props.setCurrentHierarchicalPlan(prev => {
        if (!prev) return prev;

        const status = success === false ? 'error' : 'completed';
        const updatedPlan = updateSubPlanStatus(prev, subPlanIndex, status);

        // Update main plan display
        this.props.setCurrentPlan(prevPlan => {
          if (prevPlan.length > 0 && prevPlan[0].title?.includes('Sub-plan')) {
            return createMainPlanFromHierarchical(updatedPlan);
          }
          return prevPlan;
        });

        return updatedPlan;
      });
    }

    // Add sub-plan completion message to chat
    const subPlanCompletionMessage = createSubPlanCompletionMessage(data);
    this.props.setChatMessages(prev => [...prev, subPlanCompletionMessage]);
  };

  /**
   * Handles execution completion events
   */
  handleExecutionComplete = (eventSource: EventSource): void => {
    // Mark plan as completed
    if (this.props.setCurrentHierarchicalPlan) {
      this.props.setCurrentHierarchicalPlan(prev => {
        if (!prev) return prev;

        const updatedPlan = completeHierarchicalPlan(prev);

        // Update main plan display to show all sub-plans as completed
        this.props.setCurrentPlan(prevPlan => {
          if (prevPlan.length > 0 && prevPlan[0].title?.includes('Sub-plan')) {
            return createMainPlanFromHierarchical(updatedPlan);
          }
          return prevPlan;
        });

        return updatedPlan;
      });
    }

    const completionMessage = createExecutionCompleteMessage();
    this.props.setChatMessages(prev => [...prev, completionMessage]);
    eventSource.close();
  };

  /**
   * Handles execution error events
   */
  handleExecutionError = (data: EventData, eventSource: EventSource): void => {
    if (!data.error) return;

    const errorMessage = createErrorMessage(data.error);
    this.props.setChatMessages(prev => [...prev, errorMessage]);
    eventSource.close();
  };

  /**
   * Handles page change events
   */
  handlePageChange = (data: EventData): void => {
    if (data.screenshot) {
      this.props.setCurrentScreenshot(`data:image/png;base64,${data.screenshot}`);
    }
  };

  /**
   * Handles screenshot events
   */
  handleScreenshot = (data: EventData): void => {
    if (data.screenshot) {
      this.props.setCurrentScreenshot(`data:image/png;base64,${data.screenshot}`);
    }
  };
}
