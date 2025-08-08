import type { MetaFunction } from "@remix-run/node";
import { useState, useRef, useEffect } from "react";

interface ChatMessage {
  id: number;
  type: 'user' | 'system' | 'step' | 'plan';
  text: string;
  timestamp: Date;
  description?: string;
  status?: string;
  steps?: ExecutionStep[];
}

interface ExecutionStep {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  timestamp?: Date;
  screenshot?: string; // Add screenshot property to each step
}

export const meta: MetaFunction = () => {
  return [
    { title: "Browser Automation Dashboard" },
    { name: "description", content: "Real-time browser automation visualization and control" },
  ];
};

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    backgroundColor: '#212121',
    color: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  leftSidebar: {
    width: '320px',
    backgroundColor: '#171717',
    borderRight: '1px solid #2a2a2a',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },
  rightPanel: {
    flex: 1,
    backgroundColor: '#212121',
    display: 'flex',
    flexDirection: 'row' as const,
  },
  sidebarHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #2a2a2a',
    backgroundColor: '#171717',
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '4px',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: '13px',
    color: '#9ca3af',
    fontWeight: '400',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '8px',
    color: '#e5e7eb',
  },
  tabNavigation: {
    display: 'flex',
    padding: '8px 12px',
    backgroundColor: '#1a1a1a',
    borderBottom: '1px solid #2a2a2a',
  },
  tabButton: {
    flex: 1,
    padding: '8px 16px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#9ca3af',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    borderRadius: '6px',
    transition: 'all 0.15s ease',
    margin: '0 2px',
  },
  tabButtonActive: {
    backgroundColor: '#374151',
    color: '#ffffff',
  },
  chatContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    padding: '16px',
    overflowY: 'auto' as const,
    scrollbarWidth: 'thin' as const,
  },
  messageGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  messageWrapper: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    maxWidth: '100%',
  },
  messageWrapperUser: {
    flexDirection: 'row-reverse' as const,
  },
  avatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    flexShrink: 0,
  },
  avatarSystem: {
    backgroundColor: '#10a37f',
    color: '#ffffff',
  },
  avatarUser: {
    backgroundColor: '#ff6b35',
    color: '#ffffff',
  },
  messageBubble: {
    backgroundColor: '#2a2a2a',
    borderRadius: '12px',
    padding: '12px 16px',
    maxWidth: '85%',
    position: 'relative' as const,
  },
  messageBubbleUser: {
    backgroundColor: '#ff6b35',
    marginLeft: 'auto',
  },
  messageText: {
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#ffffff',
    margin: 0,
  },
  messageTime: {
    fontSize: '11px',
    color: '#6b7280',
    marginTop: '6px',
    textAlign: 'right' as const,
  },
  stepBubble: {
    backgroundColor: '#1f2937',
    border: '1px solid #ff6b35',
    borderRadius: '8px',
    padding: '10px 14px',
    margin: '4px 0',
    maxWidth: '90%',
    alignSelf: 'flex-end' as const,
  },
  stepHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
  },
  stepTitle: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#ff6b35',
  },
  stepDescription: {
    fontSize: '12px',
    color: '#9ca3af',
    lineHeight: '1.3',
  },
  planBubble: {
    backgroundColor: '#1f2937',
    border: '1px solid #10b981',
    borderRadius: '8px',
    padding: '14px',
    margin: '4px 0',
    maxWidth: '95%',
    alignSelf: 'flex-end' as const,
  },
  planHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  planTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#10b981',
  },
  planSteps: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  planStep: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 12px',
    backgroundColor: '#374151',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
  },
  planStepRunning: {
    backgroundColor: '#1e40af',
    borderLeft: '3px solid #3b82f6',
  },
  planStepCompleted: {
    backgroundColor: '#166534',
    borderLeft: '3px solid #10b981',
  },
  planStepError: {
    backgroundColor: '#7f1d1d',
    borderLeft: '3px solid #ef4444',
  },
  planStepSelected: {
    backgroundColor: '#4338ca',
    borderLeft: '3px solid #6366f1',
  },
  planStepIcon: {
    fontSize: '16px',
    width: '20px',
    textAlign: 'center' as const,
  },
  planStepContent: {
    flex: 1,
  },
  planStepTitle: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: '2px',
  },
  planStepDescription: {
    fontSize: '11px',
    color: '#d1d5db',
    lineHeight: '1.3',
  },
  inputContainer: {
    padding: '16px',
    borderTop: '1px solid #2a2a2a',
    backgroundColor: '#171717',
  },
  inputWrapper: {
    position: 'relative' as const,
    backgroundColor: '#2a2a2a',
    borderRadius: '12px',
    border: '1px solid #374151',
    transition: 'border-color 0.15s ease',
  },
  inputWrapperFocused: {
    borderColor: '#ff6b35',
    boxShadow: '0 0 0 1px #ff6b35',
  },
  textInput: {
    width: '100%',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '12px',
    padding: '12px 50px 12px 16px',
    color: '#ffffff',
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
    resize: 'none' as const,
    minHeight: '44px',
    maxHeight: '120px',
    lineHeight: '1.4',
  },
  sendButton: {
    position: 'absolute' as const,
    right: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    backgroundColor: '#ff6b35',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
    opacity: 0.9,
  },
  settingsContainer: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto' as const,
  },
  settingsGroup: {
    marginBottom: '24px',
  },
  settingsCard: {
    backgroundColor: '#1f2937',
    border: '1px solid #374151',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: '#e5e7eb',
    marginBottom: '6px',
  },
  select: {
    width: '100%',
    backgroundColor: '#2a2a2a',
    border: '1px solid #374151',
    borderRadius: '6px',
    padding: '8px 12px',
    color: '#ffffff',
    fontSize: '13px',
    outline: 'none',
    transition: 'border-color 0.15s ease',
  },
  input: {
    width: '100%',
    backgroundColor: '#2a2a2a',
    border: '1px solid #374151',
    borderRadius: '6px',
    padding: '8px 12px',
    color: '#ffffff',
    fontSize: '13px',
    outline: 'none',
    transition: 'border-color 0.15s ease',
  },
  collapsibleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#1f2937',
    border: '1px solid #374151',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
    marginBottom: '8px',
  },
  collapsibleContent: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #374151',
    borderTop: 'none',
    borderRadius: '0 0 8px 8px',
    padding: '16px',
    marginTop: '-8px',
  },
  statusCard: {
    backgroundColor: '#1f2937',
    border: '1px solid #ff6b35',
    borderRadius: '8px',
    padding: '16px',
    marginTop: 'auto',
  },
  statusIndicator: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    marginRight: '8px',
    display: 'inline-block',
  },
  rightTabContainer: {
    backgroundColor: '#1a1a1a',
    borderBottom: '1px solid #2a2a2a',
    padding: '0 24px',
  },
  rightTabList: {
    display: 'flex',
    gap: '0',
    margin: '0',
    padding: '0',
    listStyle: 'none',
  },
  rightTab: {
    padding: '16px 20px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#9ca3af',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    transition: 'all 0.15s ease',
  },
  rightTabActive: {
    color: '#ff6b35',
    borderBottomColor: '#ff6b35',
  },
  rightTabContent: {
    flex: 1,
    padding: '24px',
    backgroundColor: '#212121',
    overflowY: 'auto' as const,
  },
  screenshotPlaceholder: {
    backgroundColor: '#1a1a1a',
    border: '2px dashed #374151',
    borderRadius: '8px',
    height: '400px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column' as const,
    color: '#6b7280',
    fontSize: '14px',
    gap: '12px',
  },
  executionPlanSection: {
    width: '350px',
    backgroundColor: '#171717',
    borderRight: '1px solid #2a2a2a',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },
  rightTabSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
  },
  executionPlanHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #2a2a2a',
    backgroundColor: '#1a1a1a',
  },
  executionPlanTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  executionPlanContent: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '16px',
  },
  planStepItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '8px',
    border: '1px solid #374151',
    transition: 'all 0.15s ease',
  },
  planStepHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
  },
  planStepStatus: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  planEmptyState: {
    textAlign: 'center' as const,
    color: '#6b7280',
    padding: '32px 16px',
  },
};

export default function Dashboard() {
  const [taskDescription, setTaskDescription] = useState('');
  const [selectedEngine, setSelectedEngine] = useState('playwright');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');
  const [leftPanelTab, setLeftPanelTab] = useState('chat');
  const [currentStep, setCurrentStep] = useState(0);
  const [currentPlan, setCurrentPlan] = useState<ExecutionStep[]>([]);
  const [currentScreenshot, setCurrentScreenshot] = useState<string | null>(null);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 1, type: 'system', text: 'Welcome! I\'m ready to help you automate browser tasks.', timestamp: new Date() },
    { id: 2, type: 'system', text: 'Configure your automation settings and describe what you\'d like me to do.', timestamp: new Date() },
  ]);

  // Chat container ref for auto-scroll
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Copy message to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  const tabs = [
    { id: 'preview', label: 'Preview Screenshot' },
    { id: 'status', label: 'Status' },
    { id: 'logs', label: 'Logs' },
    { id: 'results', label: 'Results' },
  ];

  const executionSteps = [
    { id: 1, title: 'Initialize Browser', status: 'pending', description: 'Starting browser instance' },
    { id: 2, title: 'Navigate to Page', status: 'pending', description: 'Loading target webpage' },
    { id: 3, title: 'Execute Actions', status: 'pending', description: 'Performing automation tasks' },
    { id: 4, title: 'Capture Results', status: 'pending', description: 'Collecting data and screenshots' },
    { id: 5, title: 'Complete', status: 'pending', description: 'Finalizing execution' },
  ];

  const getStepIcon = (status: string, stepIndex: number) => {
    if (status === 'completed') return '✅';
    if (status === 'running' || stepIndex === currentStep) return '🔄';
    if (status === 'error') return '❌';
    return '⭕';
  };

  const getStepStatusText = (status: string, stepIndex: number) => {
    if (status === 'completed') return 'Completed';
    if (status === 'running' || stepIndex === currentStep) return 'In Progress';
    if (status === 'error') return 'Error';
    return 'Pending';
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const handleStepClick = (stepIndex: number, step: ExecutionStep) => {
    setSelectedStepIndex(stepIndex);
    if (step.screenshot) {
      setCurrentScreenshot(step.screenshot);
    }
  };

  const getDisplayScreenshot = () => {
    if (selectedStepIndex !== null && currentPlan[selectedStepIndex]?.screenshot) {
      return currentPlan[selectedStepIndex].screenshot;
    }
    return currentScreenshot;
  };

  const handleRunTask = async () => {
    if (!taskDescription.trim()) return;
    
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now(),
      type: 'user',
      text: taskDescription,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    
    try {
      // Call the automation server
      const response = await fetch('http://localhost:3002/api/automation/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskDescription,
          engine: selectedEngine,
          options: {
            headless: false // Show browser for better UX
          }
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Add system response
        const systemResponse: ChatMessage = {
          id: Date.now() + 1,
          type: 'system',
          text: `Starting automation with ${selectedEngine}. Task ID: ${result.taskId}`,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, systemResponse]);

        // Connect to the event stream for real-time updates
        connectToEventStream();
      } else {
        // Add error message
        const errorMessage: ChatMessage = {
          id: Date.now() + 1,
          type: 'system',
          text: `Error: ${result.error}`,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      // Add network error message
      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        type: 'system',
        text: `Network error: ${error instanceof Error ? error.message : 'Failed to connect to automation server'}`,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    }
    
    setTaskDescription('');
  };

  // Connect to Server-Sent Events for real-time updates
  const connectToEventStream = () => {
    const eventSource = new EventSource('http://localhost:3002/api/execution/stream');
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'execution_start') {
          const message: ChatMessage = {
            id: Date.now(),
            type: 'system',
            text: `🚀 Starting: ${data.task}`,
            timestamp: new Date()
          };
          setChatMessages(prev => [...prev, message]);
        } else if (data.type === 'execution_event' && data.data.type === 'plan_created') {
          // Create execution plan steps
          const planSteps: ExecutionStep[] = data.data.steps ? data.data.steps.map((step: any, index: number) => ({
            id: index,
            title: step.title || step.type || `Step ${index + 1}`,
            description: step.description || 'Executing automation step...',
            status: 'pending' as const,
            timestamp: new Date()
          })) : [];
          
          setCurrentPlan(planSteps);
          
          // Add plan message to chat
          const planMessage: ChatMessage = {
            id: Date.now(),
            type: 'plan',
            text: `📋 Execution Plan (${planSteps.length} steps)`,
            timestamp: new Date(),
            steps: planSteps
          };
          setChatMessages(prev => [...prev, planMessage]);
        } else if (data.type === 'plan_created') {
          // Handle direct plan_created events (fallback)
          const planSteps: ExecutionStep[] = data.steps ? data.steps.map((step: any, index: number) => ({
            id: index,
            title: step.title || step.type || `Step ${index + 1}`,
            description: step.description || 'Executing automation step...',
            status: 'pending' as const,
            timestamp: new Date()
          })) : [];
          
          setCurrentPlan(planSteps);
          
          // Add plan message to chat
          const planMessage: ChatMessage = {
            id: Date.now(),
            type: 'plan',
            text: `📋 Execution Plan (${planSteps.length} steps)`,
            timestamp: new Date(),
            steps: planSteps
          };
          setChatMessages(prev => [...prev, planMessage]);
        } else if (data.type === 'execution_event' && data.data.type === 'step_start') {
          // Update plan step status
          setCurrentPlan(prev => prev.map((step, index) => 
            index === data.data.stepIndex 
              ? { ...step, status: 'running' as const, timestamp: new Date() }
              : step
          ));
          
          // Add step message to chat
          const stepMessage: ChatMessage = {
            id: Date.now(),
            type: 'step',
            text: data.data.step?.title || data.data.step?.type || `Step ${data.data.stepIndex + 1}`,
            description: data.data.step?.description || 'Executing step...',
            status: 'running',
            timestamp: new Date()
          };
          setChatMessages(prev => [...prev, stepMessage]);
        } else if (data.type === 'step_start') {
          // Handle direct step_start events (fallback)
          setCurrentPlan(prev => prev.map((step, index) => 
            index === data.stepIndex 
              ? { ...step, status: 'running' as const, timestamp: new Date() }
              : step
          ));
          
          const stepMessage: ChatMessage = {
            id: Date.now(),
            type: 'step',
            text: data.step?.title || data.step?.type || `Step ${data.stepIndex + 1}`,
            description: data.step?.description || 'Executing step...',
            status: 'running',
            timestamp: new Date()
          };
          setChatMessages(prev => [...prev, stepMessage]);
        } else if (data.type === 'execution_event' && data.data.type === 'step_complete') {
          // Update plan step status and screenshot
          setCurrentPlan(prev => prev.map((step, index) => 
            index === data.data.stepIndex 
              ? { 
                  ...step, 
                  status: 'completed' as const, 
                  timestamp: new Date(),
                  screenshot: data.data.screenshot ? `data:image/png;base64,${data.data.screenshot}` : step.screenshot
                }
              : step
          ));
          
          // Update current screenshot if available
          if (data.data.screenshot) {
            setCurrentScreenshot(`data:image/png;base64,${data.data.screenshot}`);
          }
        } else if (data.type === 'step_complete') {
          // Update plan step status and screenshot
          setCurrentPlan(prev => prev.map((step, index) => 
            index === data.stepIndex 
              ? { 
                  ...step, 
                  status: 'completed' as const, 
                  timestamp: new Date(),
                  screenshot: data.screenshot ? `data:image/png;base64,${data.screenshot}` : step.screenshot
                }
              : step
          ));
          
          // Update current screenshot if available
          if (data.screenshot) {
            setCurrentScreenshot(`data:image/png;base64,${data.screenshot}`);
          }
          
          // Update the last step message to completed
          setChatMessages(prev => {
            const newMessages = [...prev];
            const lastStepIndex = newMessages.length - 1;
            if (lastStepIndex >= 0 && newMessages[lastStepIndex].type === 'step') {
              newMessages[lastStepIndex] = {
                ...newMessages[lastStepIndex],
                status: 'completed'
              };
            }
            return newMessages;
          });
        } else if (data.type === 'step_error') {
          // Update plan step status
          setCurrentPlan(prev => prev.map((step, index) => 
            index === data.stepIndex 
              ? { ...step, status: 'error' as const, timestamp: new Date() }
              : step
          ));
        } else if (data.type === 'execution_complete') {
          const completionMessage: ChatMessage = {
            id: Date.now(),
            type: 'system',
            text: `✅ Automation completed successfully!`,
            timestamp: new Date()
          };
          setChatMessages(prev => [...prev, completionMessage]);
          eventSource.close();
        } else if (data.type === 'execution_error') {
          const errorMessage: ChatMessage = {
            id: Date.now(),
            type: 'system',
            text: `❌ Error: ${data.error}`,
            timestamp: new Date()
          };
          setChatMessages(prev => [...prev, errorMessage]);
          eventSource.close();
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

    eventSource.onerror = (error) => {
      console.error('EventSource failed:', error);
      eventSource.close();
    };
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') {
      handleRunTask();
    }
  };

  return (
    <div style={styles.container} onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Left Sidebar */}
      <div style={styles.leftSidebar}>
        {/* Sidebar Header */}
        <div style={styles.sidebarHeader}>
          <h1 style={styles.title}>🤖 Browser Automation</h1>
          <p style={styles.subtitle}>AI-powered web automation assistant</p>
        </div>

        {/* Tab Navigation */}
        <div style={styles.tabNavigation}>
          <button
            style={{
              ...styles.tabButton,
              ...(leftPanelTab === 'chat' ? styles.tabButtonActive : {}),
            }}
            onClick={() => setLeftPanelTab('chat')}
          >
            💬 Chat
          </button>
          <button
            style={{
              ...styles.tabButton,
              ...(leftPanelTab === 'settings' ? styles.tabButtonActive : {}),
            }}
            onClick={() => setLeftPanelTab('settings')}
          >
            ⚙️ Settings
          </button>
        </div>

        {/* Tab Content */}
        {leftPanelTab === 'chat' ? (
          <>
            {/* Chat Messages */}
            <div ref={chatContainerRef} style={styles.chatContainer}>
              {chatMessages.map((message) => (
                <div key={message.id}>
                  {message.type === 'step' ? (
                    <div style={styles.stepBubble}>
                      <div style={styles.stepHeader}>
                        <span>{getStepIcon(message.status || 'pending', 0)}</span>
                        <span style={styles.stepTitle}>{message.text}</span>
                      </div>
                      <div style={styles.stepDescription}>
                        {message.description} • {getStepStatusText(message.status || 'pending', 0)}
                      </div>
                    </div>
                  ) : message.type === 'plan' ? (
                    <div style={styles.planBubble}>
                      <div style={styles.planHeader}>
                        <span>📋</span>
                        <span style={styles.planTitle}>{message.text}</span>
                      </div>
                      <div style={styles.planSteps}>
                        {message.steps?.map((step, stepIndex) => (
                          <div 
                            key={step.id} 
                            style={{
                              ...styles.planStep,
                              ...(step.status === 'running' ? styles.planStepRunning : {}),
                              ...(step.status === 'completed' ? styles.planStepCompleted : {}),
                              ...(step.status === 'error' ? styles.planStepError : {}),
                              ...(selectedStepIndex === stepIndex ? styles.planStepSelected : {}),
                            }}
                            onClick={() => handleStepClick(stepIndex, step)}
                            onMouseOver={(e) => {
                              if (selectedStepIndex !== stepIndex) {
                                e.currentTarget.style.backgroundColor = '#4b5563';
                              }
                            }}
                            onMouseOut={(e) => {
                              if (selectedStepIndex !== stepIndex) {
                                if (step.status === 'running') {
                                  e.currentTarget.style.backgroundColor = '#1e40af';
                                } else if (step.status === 'completed') {
                                  e.currentTarget.style.backgroundColor = '#166534';
                                } else if (step.status === 'error') {
                                  e.currentTarget.style.backgroundColor = '#7f1d1d';
                                } else {
                                  e.currentTarget.style.backgroundColor = '#374151';
                                }
                              }
                            }}
                          >
                            <div style={styles.planStepIcon}>
                              {getStepIcon(step.status, step.id)}
                            </div>
                            <div style={styles.planStepContent}>
                              <div style={styles.planStepTitle}>
                                {step.title}
                                {step.screenshot && (
                                  <span style={{ fontSize: '11px', marginLeft: '8px', color: '#9ca3af' }}>
                                    📷
                                  </span>
                                )}
                              </div>
                              <div style={styles.planStepDescription}>{step.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={styles.messageWrapper}>
                      <div style={{
                        ...styles.avatar,
                        ...(message.type === 'user' ? styles.avatarUser : styles.avatarSystem),
                      }}>
                        {message.type === 'user' ? 'U' : '🤖'}
                      </div>
                      <div style={{
                        ...styles.messageBubble,
                        ...(message.type === 'user' ? styles.messageBubbleUser : {}),
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <p style={{ ...styles.messageText, flex: 1, margin: 0 }}>{message.text}</p>
                          {message.type === 'user' && (
                            <button
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#9ca3af',
                                cursor: 'pointer',
                                fontSize: '14px',
                                padding: '4px 6px',
                                borderRadius: '4px',
                                marginLeft: '8px',
                                transition: 'all 0.15s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              onClick={() => copyToClipboard(message.text)}
                              onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = '#374151';
                                e.currentTarget.style.color = '#ffffff';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#9ca3af';
                              }}
                              title="Copy message"
                            >
                              📋
                            </button>
                          )}
                        </div>
                        <div style={styles.messageTime}>
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Input Container */}
            <div style={styles.inputContainer}>
              <div style={styles.inputWrapper}>
                <textarea
                  style={styles.textInput}
                  placeholder="Message AI Assistant..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.ctrlKey && e.key === 'Enter') {
                      e.preventDefault();
                      handleRunTask();
                    }
                  }}
                />
                <button
                  style={styles.sendButton}
                  onClick={handleRunTask}
                  disabled={!taskDescription.trim()}
                  onMouseOver={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = '#e55a2b';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = '#ff6b35';
                    }
                  }}
                >
                  ↗
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={styles.settingsContainer}>
            {/* Engine Selection */}
            <div style={styles.settingsGroup}>
              <div style={styles.settingsCard}>
                <label style={styles.label}>Automation Engine</label>
                <select
                  style={styles.select}
                  value={selectedEngine}
                  onChange={(e) => setSelectedEngine(e.target.value)}
                >
                  <option value="playwright">Playwright</option>
                  <option value="selenium">Selenium</option>
                  <option value="puppeteer">Puppeteer</option>
                </select>
              </div>
            </div>

            {/* Advanced Settings */}
            <div style={styles.settingsGroup}>
              <div
                style={styles.collapsibleHeader}
                onClick={() => setAdvancedOpen(!advancedOpen)}
              >
                <span style={{ fontSize: '14px', fontWeight: '500' }}>Advanced Configuration</span>
                <span style={{ fontSize: '12px' }}>{advancedOpen ? '▼' : '▶'}</span>
              </div>
              {advancedOpen && (
                <div style={styles.collapsibleContent}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={styles.label}>Timeout (seconds)</label>
                    <input
                      type="number"
                      style={styles.input}
                      defaultValue="30"
                      min="5"
                      max="300"
                    />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={styles.label}>Browser Mode</label>
                    <select style={styles.select}>
                      <option value="headless">Headless (Background)</option>
                      <option value="headed">Headed (Visible)</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={styles.label}>Viewport Size</label>
                    <select style={styles.select}>
                      <option value="1920x1080">Desktop Full HD (1920×1080)</option>
                      <option value="1366x768">Desktop Standard (1366×768)</option>
                      <option value="1280x720">Desktop HD (1280×720)</option>
                      <option value="390x844">Mobile iPhone 12 (390×844)</option>
                      <option value="375x667">Mobile iPhone SE (375×667)</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={styles.label}>User Agent</label>
                    <select style={styles.select}>
                      <option value="default">Default Browser</option>
                      <option value="chrome-desktop">Chrome Desktop</option>
                      <option value="firefox-desktop">Firefox Desktop</option>
                      <option value="safari-desktop">Safari Desktop</option>
                      <option value="chrome-mobile">Chrome Mobile</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Current Configuration Card */}
            <div style={styles.statusCard}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ ...styles.statusIndicator, backgroundColor: '#10a37f' }}></span>
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#e5e7eb' }}>
                  Current Configuration
                </span>
              </div>
              <div style={{ fontSize: '13px', color: '#9ca3af', lineHeight: '1.4' }}>
                <div>Engine: <strong style={{ color: '#ff6b35' }}>{selectedEngine.charAt(0).toUpperCase() + selectedEngine.slice(1)}</strong></div>
                <div style={{ marginTop: '4px' }}>Ready to execute automation tasks</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel */}
      <div style={styles.rightPanel}>
        {/* Execution Plan Section */}
        <div style={styles.executionPlanSection}>
          <div style={styles.executionPlanHeader}>
            <h3 style={styles.executionPlanTitle}>
              📋 Execution Plan
            </h3>
          </div>
          <div style={styles.executionPlanContent}>
            {currentPlan.length > 0 ? (
              <div>
                {currentPlan.map((step, index) => (
                  <div
                    key={step.id}
                    style={{
                      ...styles.planStepItem,
                      ...(step.status === 'pending' ? { borderColor: '#6b7280' } : {}),
                      ...(step.status === 'running' ? { borderColor: '#ff6b35', backgroundColor: '#2a1a0f' } : {}),
                      ...(step.status === 'completed' ? { borderColor: '#10b981', backgroundColor: '#0f2a1a' } : {}),
                      ...(step.status === 'error' ? { borderColor: '#ef4444', backgroundColor: '#2a0f0f' } : {}),
                      cursor: step.screenshot ? 'pointer' : 'default',
                    }}
                    onClick={() => step.screenshot && handleStepClick(index, step)}
                  >
                    <div style={styles.planStepHeader}>
                      <div
                        style={{
                          ...styles.planStepStatus,
                          backgroundColor: 
                            step.status === 'pending' ? '#6b7280' :
                            step.status === 'running' ? '#ff6b35' :
                            step.status === 'completed' ? '#10b981' :
                            step.status === 'error' ? '#ef4444' : '#6b7280'
                        }}
                      />
                      <div style={styles.planStepTitle}>
                        Step {index + 1}: {step.title}
                      </div>
                    </div>
                    <div style={styles.planStepDescription}>
                      {step.description}
                    </div>
                    {step.timestamp && (
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                        {formatTime(step.timestamp)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.planEmptyState}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
                <div style={{ fontSize: '14px', marginBottom: '8px' }}>No execution plan yet</div>
                <div style={{ fontSize: '12px' }}>
                  Start an automation task to see the execution plan here
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Tab Section */}
        <div style={styles.rightTabSection}>
          {/* Tab Navigation */}
          <div style={styles.rightTabContainer}>
            <ul style={styles.rightTabList}>
              {tabs.map((tab) => (
                <li key={tab.id}>
                  <button
                    style={{
                      ...styles.rightTab,
                      ...(activeTab === tab.id ? styles.rightTabActive : {}),
                    }}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Tab Content */}
          <div style={styles.rightTabContent}>
          {activeTab === 'preview' && (
            <div>
              <h2 style={styles.sectionTitle}>Live Browser Preview</h2>
              {getDisplayScreenshot() ? (
                <div style={{ textAlign: 'center' }}>
                  <img 
                    src={getDisplayScreenshot()!} 
                    alt="Browser Screenshot" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '600px', 
                      border: '1px solid #374151', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }} 
                  />
                  <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px' }}>
                    {selectedStepIndex !== null 
                      ? `Screenshot from Step ${selectedStepIndex + 1}: ${currentPlan[selectedStepIndex]?.title || 'Unknown Step'}`
                      : 'Latest browser screenshot from automation'
                    }
                  </div>
                  {selectedStepIndex !== null && (
                    <button
                      style={{
                        backgroundColor: '#374151',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        marginTop: '8px',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease'
                      }}
                      onClick={() => {
                        setSelectedStepIndex(null);
                        // Show the latest screenshot when deselecting
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#4b5563';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#374151';
                      }}
                    >
                      Show Latest Screenshot
                    </button>
                  )}
                </div>
              ) : (
                <div style={styles.screenshotPlaceholder}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📷</div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '16px', marginBottom: '8px', color: '#9ca3af' }}>
                      Browser screenshot will appear here
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                      Start a task to see real-time automation, or click on steps to see their screenshots
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'status' && (
            <div>
              <h2 style={styles.sectionTitle}>System Status</h2>
              <div style={styles.settingsCard}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ ...styles.statusIndicator, backgroundColor: '#10a37f' }}></span>
                  <strong style={{ color: '#e5e7eb' }}>Automation Engine</strong>
                </div>
                <p style={{ color: '#9ca3af', margin: '0', fontSize: '13px' }}>
                  {selectedEngine.charAt(0).toUpperCase() + selectedEngine.slice(1)} is ready and operational
                </p>
              </div>
              <div style={styles.settingsCard}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ ...styles.statusIndicator, backgroundColor: '#10a37f' }}></span>
                  <strong style={{ color: '#e5e7eb' }}>AI Assistant</strong>
                </div>
                <p style={{ color: '#9ca3af', margin: '0', fontSize: '13px' }}>
                  Connected and ready to help with browser automation
                </p>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div>
              <h2 style={styles.sectionTitle}>Execution Logs</h2>
              <div style={{ ...styles.settingsCard, fontFamily: 'Monaco, "Lucida Console", monospace', fontSize: '12px' }}>
                <div style={{ color: '#10a37f', marginBottom: '4px' }}>[INFO] System initialized successfully</div>
                <div style={{ color: '#9ca3af', marginBottom: '4px' }}>[INFO] Automation engine ready</div>
                <div style={{ color: '#9ca3af' }}>[INFO] Waiting for user input...</div>
              </div>
            </div>
          )}

          {activeTab === 'results' && (
            <div>
              <h2 style={styles.sectionTitle}>Automation Results</h2>
              <div style={styles.settingsCard}>
                <div style={{ textAlign: 'center', color: '#6b7280', padding: '32px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '16px' }}>📊</div>
                  <div style={{ fontSize: '14px', marginBottom: '8px' }}>No results yet</div>
                  <div style={{ fontSize: '12px' }}>Execute an automation task to see results here</div>
                </div>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
