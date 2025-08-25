import { styles } from '../../Dashboard.styles';
import type { ExecutionPlan, ExecutionStep, TabItem } from '../../Dashboard.types';
import { ExecutionPlanComponent } from './ExecutionPlan';
import { TabSection } from './TabSection/index';

interface RightPanelProps {
  currentPlan: ExecutionStep[];
  currentExecutionPlan?: ExecutionPlan | null;
  isLoading?: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabs: TabItem[];
  selectedStepIndex: number | null;
  setSelectedStepIndex: (index: number | null) => void;
  getDisplayScreenshot: () => string | null;
  selectedEngine: string;
  handleStepClick: (stepIndex: number, step: ExecutionStep) => void;
  sessionId?: string;
}

export default function RightPanel({
  currentPlan,
  currentExecutionPlan,
  isLoading = false,
  activeTab,
  setActiveTab,
  tabs,
  selectedStepIndex,
  setSelectedStepIndex,
  getDisplayScreenshot,
  selectedEngine,
  handleStepClick,
  sessionId,
}: RightPanelProps) {
  return (
    <div style={styles.rightPanel}>
      {/* Execution Plan Section */}
      <ExecutionPlanComponent
        currentExecutionPlan={currentExecutionPlan}
        isLoading={isLoading}
        handleStepClick={handleStepClick}
      />

      {/* Tab Section */}
      <TabSection
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={tabs}
        selectedStepIndex={selectedStepIndex}
        setSelectedStepIndex={setSelectedStepIndex}
        getDisplayScreenshot={getDisplayScreenshot}
        selectedEngine={selectedEngine}
        currentPlan={currentPlan}
        sessionId={sessionId}
        isLoading={isLoading}
      />
    </div>
  );
}
