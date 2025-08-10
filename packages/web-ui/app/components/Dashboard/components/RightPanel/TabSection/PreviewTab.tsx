import React from 'react';
import type { ExecutionStep } from '../../../Dashboard.types';
import { styles } from '../../../Dashboard.styles';

interface PreviewTabProps {
  selectedStepIndex: number | null;
  setSelectedStepIndex: (index: number | null) => void;
  getDisplayScreenshot: () => string | null;
  currentPlan: ExecutionStep[];
}

export const PreviewTab: React.FC<PreviewTabProps> = ({
  selectedStepIndex,
  setSelectedStepIndex,
  getDisplayScreenshot,
  currentPlan,
}) => {
  const displayScreenshot = getDisplayScreenshot();

  return (
    <div>
      <h2 style={styles.sectionTitle}>Live Browser Preview</h2>
      {displayScreenshot ? (
        <div style={{ textAlign: 'center' }}>
          <img
            src={displayScreenshot}
            alt='Browser Screenshot'
            style={{
              maxWidth: '100%',
              maxHeight: '600px',
              border: '1px solid #374151',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
          />
          <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px' }}>
            {selectedStepIndex !== null
              ? `Screenshot from Step ${selectedStepIndex + 1}: ${currentPlan[selectedStepIndex]?.title || 'Unknown Step'}`
              : 'Latest browser screenshot from automation'}
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
                transition: 'background-color 0.15s ease',
              }}
              onClick={() => {
                setSelectedStepIndex(null);
                // Show the latest screenshot when deselecting
              }}
              onMouseOver={e => {
                e.currentTarget.style.backgroundColor = '#4b5563';
              }}
              onMouseOut={e => {
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
  );
};
