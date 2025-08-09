import { Badge, Caption1, Card, CardHeader, ProgressBar, Title3 } from '@fluentui/react-components';
import {
  Camera24Regular,
  CheckmarkCircle24Regular,
  Clock24Regular,
  ErrorCircle24Regular,
  Play24Regular,
} from '@fluentui/react-icons';
import { ExecutionSession, ExecutionStep } from '../hooks/useVisualization';

interface ExecutionStepsProps {
  session?: ExecutionSession;
  onStepClick?: (step: ExecutionStep) => void;
  selectedStepIndex?: number;
}

export function ExecutionSteps({ session, onStepClick, selectedStepIndex }: ExecutionStepsProps) {
  if (!session) {
    return (
      <Card style={{ height: '100%' }}>
        <CardHeader>
          <Title3>Execution Steps</Title3>
          <Caption1>No active execution</Caption1>
        </CardHeader>
        <div>
          <div style={{ textAlign: 'center', padding: '40px', color: '#605e5c' }}>
            <Clock24Regular style={{ fontSize: '48px', marginBottom: '16px' }} />
            <div>Waiting for automation to start...</div>
          </div>
        </div>
      </Card>
    );
  }

  const progress = session.totalSteps > 0 ? (session.completedSteps / session.totalSteps) * 100 : 0;

  const getStatusIcon = (status: ExecutionStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckmarkCircle24Regular style={{ color: '#107c10' }} />;
      case 'active':
        return <Play24Regular style={{ color: '#0078d4' }} />;
      case 'failed':
        return <ErrorCircle24Regular style={{ color: '#d13438' }} />;
      default:
        return <Clock24Regular style={{ color: '#605e5c' }} />;
    }
  };

  const getStatusColor = (status: ExecutionStep['status']) => {
    switch (status) {
      case 'completed':
        return '#107c10';
      case 'active':
        return '#0078d4';
      case 'failed':
        return '#d13438';
      default:
        return '#605e5c';
    }
  };

  return (
    <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <Title3>Execution Steps</Title3>
            <Caption1>Session: {session.sessionId.substring(0, 8)}...</Caption1>
          </div>
          <Badge
            appearance='filled'
            color={session.status === 'active' ? 'brand' : session.status === 'completed' ? 'success' : 'danger'}
          >
            {session.status}
          </Badge>
        </div>
      </CardHeader>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Progress */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <Caption1>Progress</Caption1>
            <Caption1>
              {session.completedSteps} / {session.totalSteps}
            </Caption1>
          </div>
          <ProgressBar value={progress} />
        </div>

        {/* Steps */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {session.steps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#605e5c' }}>
              <Caption1>No steps yet</Caption1>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {session.steps.map(step => (
                <div
                  key={step.index}
                  onClick={() => onStepClick?.(step)}
                  style={{
                    padding: '12px',
                    border: `1px solid ${selectedStepIndex === step.index ? '#0078d4' : '#e1e1e1'}`,
                    borderRadius: '8px',
                    cursor: onStepClick ? 'pointer' : 'default',
                    backgroundColor: selectedStepIndex === step.index ? '#f6f8fa' : 'white',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => {
                    if (onStepClick) {
                      e.currentTarget.style.backgroundColor = '#f6f8fa';
                    }
                  }}
                  onMouseLeave={e => {
                    if (selectedStepIndex !== step.index) {
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: getStatusColor(step.status),
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: '600',
                      }}
                    >
                      {step.index + 1}
                    </div>
                    <div style={{ flex: 1, fontSize: '14px', fontWeight: '500' }}>{step.action}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {step.hasScreenshot && <Camera24Regular style={{ fontSize: '16px', color: '#0078d4' }} />}
                      {getStatusIcon(step.status)}
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#605e5c', marginLeft: '32px' }}>{step.message}</div>
                  {step.startTime && (
                    <div style={{ fontSize: '11px', color: '#8a8886', marginLeft: '32px', marginTop: '4px' }}>
                      {new Date(step.startTime).toLocaleTimeString()}
                      {step.endTime && ` - ${new Date(step.endTime).toLocaleTimeString()}`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
