import { useEffect, useState } from 'react';
import type { ChatMessage, ExecutionStep, HierarchicalPlan } from '../Dashboard.types';
import { AUTOMATION_SERVER_URL } from '../utils/constants';

interface UseEventStreamProps {
  setCurrentPlan: React.Dispatch<React.SetStateAction<ExecutionStep[]>>;
  setCurrentHierarchicalPlan?: React.Dispatch<React.SetStateAction<HierarchicalPlan | null>>;
  setCurrentScreenshot: React.Dispatch<React.SetStateAction<string | null>>;
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  updateLastStepMessage: (status: string) => void;
}

export const useEventStreamSimple = ({
  setCurrentPlan,
  setCurrentHierarchicalPlan,
  setCurrentScreenshot,
  setChatMessages,
  updateLastStepMessage,
}: UseEventStreamProps) => {
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  const connectToEventStream = () => {
    const newEventSource = new EventSource(`${AUTOMATION_SERVER_URL}/api/execution/stream`);

    newEventSource.onmessage = event => {
      try {
        const data = JSON.parse(event.data);
        
        // Log specific event types we care about
        if (data.type === 'execution_event') {
          if (data.data.type === 'plan_created') {
            console.log('Plan created data:', data.data);
          } else if (data.data.type === 'hierarchical_plan_created') {
            console.log('Hierarchical plan created data:', data.data);
          }
        }

        if (data.type === 'execution_start') {
          const message: ChatMessage = {
            id: Date.now(),
            type: 'system',
            text: `Starting: ${data.task}`,
            timestamp: new Date(),
          };
          setChatMessages(prev => [...prev, message]);
        } else if (data.type === 'execution_event' && data.data.type === 'plan_created') {
          // Create execution plan steps
          const planSteps: ExecutionStep[] = data.data.steps
            ? data.data.steps.map((step: any, index: number) => ({
                id: index,
                title: step.title || step.type || `Step ${index + 1}`,
                description: step.description || 'Executing automation step...',
                status: 'pending' as const,
                timestamp: new Date(),
              }))
            : [];

          setCurrentPlan(planSteps);

          // Add plan message to chat
          const planMessage: ChatMessage = {
            id: Date.now(),
            type: 'plan',
            text: `Execution Plan (${planSteps.length} steps)`,
            timestamp: new Date(),
            steps: planSteps,
          };
          setChatMessages(prev => [...prev, planMessage]);
        } else if (data.type === 'execution_event' && data.data.type === 'hierarchical_plan_created') {
          console.log('Received hierarchical_plan_created event:', data.data);
          
          // Handle hierarchical plan creation
          const hierarchicalPlan: HierarchicalPlan = {
            id: data.data.hierarchicalPlan?.id || 'hierarchical-plan',
            globalObjective: data.data.globalObjective || data.data.hierarchicalPlan?.globalObjective || 'Complex task execution',
            subPlans: data.data.hierarchicalPlan?.subPlans?.map((subPlan: any, index: number) => ({
              id: subPlan.id || `sub-plan-${index}`,
              objective: subPlan.objective,
              description: subPlan.description,
              steps: subPlan.steps?.map((step: any, stepIndex: number) => ({
                id: stepIndex,
                title: step.title || step.type || `Step ${stepIndex + 1}`,
                description: step.description || 'Executing step...',
                status: 'pending' as const,
                timestamp: new Date(),
                actionType: step.type,
                target: step.target,
                value: step.value
              })) || [],
              estimatedDuration: subPlan.estimatedDuration || 0,
              priority: subPlan.priority || index + 1,
              status: 'pending' as const,
              dependencies: subPlan.dependencies || []
            })) || [],
            totalEstimatedDuration: data.data.hierarchicalPlan?.totalEstimatedDuration || 0,
            planningStrategy: data.data.planningStrategy || data.data.hierarchicalPlan?.planningStrategy || 'sequential',
            currentSubPlanIndex: 0,
            metadata: data.data.hierarchicalPlan?.metadata
          };

          // Update hierarchical plan state
          if (setCurrentHierarchicalPlan) {
            console.log('Setting hierarchical plan in state:', hierarchicalPlan);
            setCurrentHierarchicalPlan(hierarchicalPlan);
          }

          // Create sub-plan overview steps for the main plan display
          const subPlanSteps: ExecutionStep[] = hierarchicalPlan.subPlans.map((subPlan, index) => ({
            id: index,
            title: `Sub-plan ${index + 1}: ${subPlan.objective}`,
            description: `${subPlan.steps.length} steps • Priority: ${subPlan.priority} • Est: ${Math.round(subPlan.estimatedDuration / 1000)}s`,
            status: 'pending' as const,
            timestamp: new Date()
          }));

          setCurrentPlan(subPlanSteps);

          // Add hierarchical plan message to chat
          const hierarchicalPlanMessage: ChatMessage = {
            id: Date.now(),
            type: 'hierarchical_plan',
            text: `🧠 Hierarchical Plan: ${hierarchicalPlan.globalObjective} (${hierarchicalPlan.subPlans.length} sub-plans)`,
            timestamp: new Date(),
            hierarchicalPlan
          };
          setChatMessages(prev => [...prev, hierarchicalPlanMessage]);
        } else if (data.type === 'plan_created') {
          // Handle direct plan_created events (fallback)
          const planSteps: ExecutionStep[] = data.steps
            ? data.steps.map((step: any, index: number) => ({
                id: index,
                title: step.title || step.type || `Step ${index + 1}`,
                description: step.description || 'Executing automation step...',
                status: 'pending' as const,
                timestamp: new Date(),
              }))
            : [];

          setCurrentPlan(planSteps);

          // Add plan message to chat
          const planMessage: ChatMessage = {
            id: Date.now(),
            type: 'plan',
            text: `Execution Plan (${planSteps.length} steps)`,
            timestamp: new Date(),
            steps: planSteps,
          };
          setChatMessages(prev => [...prev, planMessage]);
        } else if (data.type === 'execution_event' && data.data.type === 'step_start') {
          // Update plan step status
          setCurrentPlan(prev => {
            // If no plan exists, create one from the step
            if (prev.length === 0) {
              return [{
                id: data.data.stepIndex || 0,
                title: data.data.step?.title || data.data.step?.type || `Step ${(data.data.stepIndex || 0) + 1}`,
                description: data.data.step?.description || 'Executing step...',
                status: 'running' as const,
                timestamp: new Date(),
                actionType: data.data.step?.type,
                target: data.data.step?.target,
                value: data.data.step?.value
              }];
            }
            
            // Extend plan if step index is beyond current plan
            if (data.data.stepIndex >= prev.length) {
              const newSteps = [...prev];
              for (let i = prev.length; i <= data.data.stepIndex; i++) {
                newSteps.push({
                  id: i,
                  title: i === data.data.stepIndex ? 
                    (data.data.step?.title || data.data.step?.type || `Step ${i + 1}`) :
                    `Step ${i + 1}`,
                  description: i === data.data.stepIndex ? 
                    (data.data.step?.description || 'Executing step...') :
                    'Pending step...',
                  status: i === data.data.stepIndex ? 'running' as const : 'pending' as const,
                  timestamp: new Date(),
                  actionType: i === data.data.stepIndex ? data.data.step?.type : undefined,
                  target: i === data.data.stepIndex ? data.data.step?.target : undefined,
                  value: i === data.data.stepIndex ? data.data.step?.value : undefined
                });
              }
              return newSteps;
            }
            
            // Update existing step
            return prev.map((step, index) =>
              index === data.data.stepIndex ? { 
                ...step, 
                status: 'running' as const, 
                timestamp: new Date(),
                title: data.data.step?.title || step.title,
                description: data.data.step?.description || step.description,
                actionType: data.data.step?.type || step.actionType,
                target: data.data.step?.target || step.target,
                value: data.data.step?.value || step.value
              } : step,
            );
          });

          // Add step message to chat
          const stepMessage: ChatMessage = {
            id: Date.now(),
            type: 'step',
            text: data.data.step?.title || data.data.step?.type || `Step ${data.data.stepIndex + 1}`,
            description: data.data.step?.description || 'Executing step...',
            status: 'running',
            timestamp: new Date(),
          };
          setChatMessages(prev => [...prev, stepMessage]);
        } else if (data.type === 'step_start') {
          // Handle direct step_start events (fallback)
          setCurrentPlan(prev =>
            prev.map((step, index) =>
              index === data.stepIndex ? { ...step, status: 'running' as const, timestamp: new Date() } : step,
            ),
          );

          const stepMessage: ChatMessage = {
            id: Date.now(),
            type: 'step',
            text: data.step?.title || data.step?.type || `Step ${data.stepIndex + 1}`,
            description: data.step?.description || 'Executing step...',
            status: 'running',
            timestamp: new Date(),
          };
          setChatMessages(prev => [...prev, stepMessage]);
        } else if (data.type === 'execution_event' && data.data.type === 'step_complete') {
          // Update plan step status and screenshot
          setCurrentPlan(prev => {
            // If no plan exists, create one from the step
            if (prev.length === 0) {
              return [{
                id: data.data.stepIndex || 0,
                title: data.data.step?.title || data.data.step?.type || `Step ${(data.data.stepIndex || 0) + 1}`,
                description: data.data.step?.description || 'Completed step',
                status: 'completed' as const,
                timestamp: new Date(),
                screenshot: data.data.screenshot ? `data:image/png;base64,${data.data.screenshot}` : undefined,
                actionType: data.data.step?.type,
                target: data.data.step?.target,
                value: data.data.step?.value
              }];
            }
            
            // Extend plan if step index is beyond current plan
            if (data.data.stepIndex >= prev.length) {
              const newSteps = [...prev];
              for (let i = prev.length; i <= data.data.stepIndex; i++) {
                newSteps.push({
                  id: i,
                  title: i === data.data.stepIndex ? 
                    (data.data.step?.title || data.data.step?.type || `Step ${i + 1}`) :
                    `Step ${i + 1}`,
                  description: i === data.data.stepIndex ? 
                    (data.data.step?.description || 'Completed step') :
                    'Pending step...',
                  status: i === data.data.stepIndex ? 'completed' as const : 'pending' as const,
                  timestamp: new Date(),
                  screenshot: i === data.data.stepIndex && data.data.screenshot ? 
                    `data:image/png;base64,${data.data.screenshot}` : undefined,
                  actionType: i === data.data.stepIndex ? data.data.step?.type : undefined,
                  target: i === data.data.stepIndex ? data.data.step?.target : undefined,
                  value: i === data.data.stepIndex ? data.data.step?.value : undefined
                });
              }
              return newSteps;
            }
            
            // Update existing step
            return prev.map((step, index) =>
              index === data.data.stepIndex
                ? {
                    ...step,
                    status: 'completed' as const,
                    timestamp: new Date(),
                    screenshot: data.data.screenshot
                      ? `data:image/png;base64,${data.data.screenshot}`
                      : step.screenshot,
                    title: data.data.step?.title || step.title,
                    description: data.data.step?.description || step.description,
                    actionType: data.data.step?.type || step.actionType,
                    target: data.data.step?.target || step.target,
                    value: data.data.step?.value || step.value
                  }
                : step,
            );
          });

          // Update current screenshot if available
          if (data.data.screenshot) {
            setCurrentScreenshot(`data:image/png;base64,${data.data.screenshot}`);
          }
        } else if (data.type === 'step_complete') {
          // Update plan step status and screenshot
          setCurrentPlan(prev =>
            prev.map((step, index) =>
              index === data.stepIndex
                ? {
                    ...step,
                    status: 'completed' as const,
                    timestamp: new Date(),
                    screenshot: data.screenshot ? `data:image/png;base64,${data.screenshot}` : step.screenshot,
                  }
                : step,
            ),
          );

          // Update current screenshot if available
          if (data.screenshot) {
            setCurrentScreenshot(`data:image/png;base64,${data.screenshot}`);
          }

          // Update the last step message to completed
          updateLastStepMessage('completed');
        } else if (data.type === 'execution_event' && data.data.type === 'step_complete') {
          // Handle hierarchical step completion
          if (setCurrentHierarchicalPlan) {
            setCurrentHierarchicalPlan(prev => {
              if (!prev || prev.currentSubPlanIndex === undefined) return prev;

              const updatedHierarchical: HierarchicalPlan = {
                ...prev,
                subPlans: prev.subPlans.map((subPlan, subPlanIndex) => 
                  subPlanIndex === prev.currentSubPlanIndex ? {
                    ...subPlan,
                    steps: subPlan.steps.map((step, stepIndex) =>
                      stepIndex === data.data.stepIndex ? {
                        ...step,
                        status: 'completed' as const,
                        timestamp: new Date(),
                        screenshot: data.data.screenshot ? `data:image/png;base64,${data.data.screenshot}` : step.screenshot
                      } : step
                    )
                  } : subPlan
                )
              };

              // Update main plan display if showing hierarchical view
              setCurrentPlan(prevPlan => {
                if (prevPlan.length > 0 && prevPlan[0].title?.includes('Sub-plan')) {
                  const currentSubPlanIndex = updatedHierarchical.currentSubPlanIndex;
                  const currentSubPlan = currentSubPlanIndex !== undefined ? updatedHierarchical.subPlans[currentSubPlanIndex] : null;
                  const currentSubPlanSteps: ExecutionStep[] = currentSubPlan ? currentSubPlan.steps.map((step: any, stepIndex: number) => ({
                    id: 1000 + stepIndex,
                    title: `  └─ ${step.title}`,
                    description: step.description,
                    status: step.status,
                    timestamp: step.timestamp || new Date(),
                    screenshot: data.data.screenshot ? `data:image/png;base64,${data.data.screenshot}` : step.screenshot
                  })) : [];

                  return [
                    ...updatedHierarchical.subPlans.map((subPlan, index) => ({
                      id: index,
                      title: `Sub-plan ${index + 1}: ${subPlan.objective}`,
                      description: `${subPlan.steps.length} steps • Priority: ${subPlan.priority} • Est: ${Math.round(subPlan.estimatedDuration / 1000)}s`,
                      status: subPlan.status,
                      timestamp: new Date()
                    })),
                    ...currentSubPlanSteps
                  ];
                }
                return prevPlan.map((step, index) =>
                  index === data.data.stepIndex ? {
                    ...step,
                    status: 'completed' as const,
                    timestamp: new Date(),
                    screenshot: data.data.screenshot ? `data:image/png;base64,${data.data.screenshot}` : step.screenshot
                  } : step
                );
              });

              return updatedHierarchical;
            });
          }

          // Update current screenshot if available
          if (data.data.screenshot) {
            setCurrentScreenshot(`data:image/png;base64,${data.data.screenshot}`);
          }

          // Update the last step message to completed
          updateLastStepMessage('completed');
        } else if (data.type === 'execution_event' && data.data.type === 'sub_plan_completed') {
          // Handle sub-plan completion
          if (setCurrentHierarchicalPlan) {
            setCurrentHierarchicalPlan(prev => {
              if (!prev) return prev;

              const updatedHierarchical: HierarchicalPlan = {
                ...prev,
                subPlans: prev.subPlans.map((subPlan, index) =>
                  index === data.data.subPlanIndex ? { ...subPlan, status: data.data.error ? 'error' as const : 'completed' as const } : subPlan
                )
              };

              // Update main plan display
              setCurrentPlan(prevPlan => {
                if (prevPlan.length > 0 && prevPlan[0].title?.includes('Sub-plan')) {
                  return updatedHierarchical.subPlans.map((subPlan, index) => ({
                    id: index,
                    title: `Sub-plan ${index + 1}: ${subPlan.objective}`,
                    description: `${subPlan.steps.length} steps • Priority: ${subPlan.priority} • Est: ${Math.round(subPlan.estimatedDuration / 1000)}s`,
                    status: subPlan.status,
                    timestamp: new Date()
                  }));
                }
                return prevPlan;
              });

              return updatedHierarchical;
            });
          }

          // Add sub-plan completion message to chat
          const status = data.data.error ? 'failed' : 'completed';
          const subPlanCompletionMessage: ChatMessage = {
            id: Date.now(),
            type: 'system',
            text: `✅ Sub-plan ${data.data.subPlanIndex + 1}/${data.data.totalSubPlans} ${status}: ${data.data.subPlan?.objective || 'Sub-plan execution'}`,
            timestamp: new Date()
          };
          setChatMessages(prev => [...prev, subPlanCompletionMessage]);
        } else if (data.type === 'sub_plan_completed') {
          // Handle direct sub_plan_completed events (fallback)
          if (setCurrentHierarchicalPlan) {
            setCurrentHierarchicalPlan(prev => {
              if (!prev) return prev;

              const updatedHierarchical: HierarchicalPlan = {
                ...prev,
                subPlans: prev.subPlans.map((subPlan, index) =>
                  index === data.subPlanIndex ? { ...subPlan, status: data.error ? 'error' as const : 'completed' as const } : subPlan
                )
              };

              // Update main plan display
              setCurrentPlan(prevPlan => {
                if (prevPlan.length > 0 && prevPlan[0].title?.includes('Sub-plan')) {
                  return updatedHierarchical.subPlans.map((subPlan, index) => ({
                    id: index,
                    title: `Sub-plan ${index + 1}: ${subPlan.objective}`,
                    description: `${subPlan.steps.length} steps • Priority: ${subPlan.priority} • Est: ${Math.round(subPlan.estimatedDuration / 1000)}s`,
                    status: subPlan.status,
                    timestamp: new Date()
                  }));
                }
                return prevPlan;
              });

              return updatedHierarchical;
            });
          }

          // Add sub-plan completion message to chat
          const status = data.error ? 'failed' : 'completed';
          const subPlanCompletionMessage: ChatMessage = {
            id: Date.now(),
            type: 'system',
            text: `✅ Sub-plan ${data.subPlanIndex + 1}/${data.totalSubPlans} ${status}: ${data.subPlan?.objective || 'Sub-plan execution'}`,
            timestamp: new Date()
          };
          setChatMessages(prev => [...prev, subPlanCompletionMessage]);
        } else if (data.type === 'step_error') {
          // Update plan step status to error
          setCurrentPlan(prev => {
            // If no plan exists, create one from the step error
            if (prev.length === 0) {
              return [{
                id: data.stepIndex || 0,
                title: data.step?.title || data.step?.type || `Step ${(data.stepIndex || 0) + 1}`,
                description: data.step?.description || 'Step failed',
                status: 'error' as const,
                timestamp: new Date(),
                actionType: data.step?.type,
                target: data.step?.target,
                value: data.step?.value
              }];
            }
            
            // Extend plan if step index is beyond current plan
            if (data.stepIndex >= prev.length) {
              const newSteps = [...prev];
              for (let i = prev.length; i <= data.stepIndex; i++) {
                newSteps.push({
                  id: i,
                  title: i === data.stepIndex ? 
                    (data.step?.title || data.step?.type || `Step ${i + 1}`) :
                    `Step ${i + 1}`,
                  description: i === data.stepIndex ? 
                    (data.step?.description || 'Step failed') :
                    'Pending step...',
                  status: i === data.stepIndex ? 'error' as const : 'pending' as const,
                  timestamp: new Date(),
                  actionType: i === data.stepIndex ? data.step?.type : undefined,
                  target: i === data.stepIndex ? data.step?.target : undefined,
                  value: i === data.stepIndex ? data.step?.value : undefined
                });
              }
              return newSteps;
            }
            
            // Update existing step
            return prev.map((step, index) =>
              index === data.stepIndex ? { 
                ...step, 
                status: 'error' as const, 
                timestamp: new Date(),
                title: data.step?.title || step.title,
                description: data.step?.description || step.description,
                actionType: data.step?.type || step.actionType,
                target: data.step?.target || step.target,
                value: data.step?.value || step.value
              } : step,
            );
          });
        } else if (data.type === 'execution_complete') {
          const completionMessage: ChatMessage = {
            id: Date.now(),
            type: 'system',
            text: `Automation completed successfully!`,
            timestamp: new Date(),
          };
          setChatMessages(prev => [...prev, completionMessage]);
          newEventSource.close();
        } else if (data.type === 'execution_error') {
          const errorMessage: ChatMessage = {
            id: Date.now(),
            type: 'system',
            text: `Error: ${data.error}`,
            timestamp: new Date(),
          };
          setChatMessages(prev => [...prev, errorMessage]);
          newEventSource.close();
        } else if (data.type === 'page_change') {
          // Update screenshot when page changes
          if (data.screenshot) {
            setCurrentScreenshot(`data:image/png;base64,${data.screenshot}`);
          }
        } else if (data.type === 'screenshot') {
          // Handle dedicated screenshot events
          if (data.screenshot) {
            setCurrentScreenshot(`data:image/png;base64,${data.screenshot}`);
          }
        }
      } catch (error) {
        console.error('Error parsing event data:', error);
      }
    };

    newEventSource.onerror = error => {
      console.error('EventSource failed:', error);
      newEventSource.close();
    };

    setEventSource(newEventSource);

    return newEventSource;
  };

  useEffect(() => {
    // Auto-connect to event stream on mount
    const source = connectToEventStream();
    
    return () => {
      if (source) {
        source.close();
      }
    };
  }, []); // Empty dependency array - only run on mount

  useEffect(() => {
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [eventSource]);

  return {
    connectToEventStream,
  };
};
