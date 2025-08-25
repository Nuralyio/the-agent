import React, { useState, useEffect } from 'react';
import { AUTOMATION_SERVER_URL } from '../../../utils/constants';

interface ExportTabProps {
  isTaskRunning?: boolean;
}

interface ExportData {
  id: string;
  timestamp: string;
  globalObjective: string;
  totalDuration: number;
  totalSteps: number;
  success: boolean;
  planningStrategy: string;
  subPlans: any[];
  summary: any;
  metadata: {
    exportedAt: string;
    exportFormat: 'json';
    agentVersion: string;
  };
}

export const ExportTab: React.FC<ExportTabProps> = ({ isTaskRunning = false }) => {
  const [exportData, setExportData] = useState<ExportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Fetch export data from the API
  const fetchExportData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${AUTOMATION_SERVER_URL}/api/automation/export`);
      const result = await response.json();

      if (result.success) {
        setExportData(result.data);
      } else {
        setError(result.error || 'Failed to fetch export data');
      }
    } catch (err) {
      setError('Network error while fetching export data');
      console.error('Export fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on component mount, but only if no task is running
  useEffect(() => {
    if (!isTaskRunning) {
      fetchExportData();
    }
  }, [isTaskRunning]);

  const jsonString = exportData ? JSON.stringify(exportData, null, 2) : '';

  const handleCopyToClipboard = async () => {
    if (!jsonString) return;

    try {
      await navigator.clipboard.writeText(jsonString);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleDownload = () => {
    if (!exportData || !jsonString) return;

    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    // Generate filename based on task and timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
    const taskSlug = (exportData?.globalObjective || 'task')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 30);

    a.href = url;
    a.download = `execution-plan_${taskSlug}_${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRefresh = () => {
    fetchExportData();
  };

  return (
    <div style={{ padding: '16px', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: '#ffffff' }}>
          Export Execution Plan
        </h2>
        <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '16px' }}>
          Export the complete execution plan with subplans and actions as JSON
        </p>
      </div>

      {isTaskRunning ? (
        <div style={{
          textAlign: 'center',
          padding: '32px',
          color: '#f59e0b',
          backgroundColor: '#1e293b',
          borderRadius: '8px',
          border: '1px solid #334155'
        }}>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>🚀 Task is currently running...</p>
          <p style={{ fontSize: '14px' }}>Export will be available once the task completes</p>
        </div>
      ) : loading ? (
        <div style={{
          textAlign: 'center',
          padding: '32px',
          color: '#94a3b8',
          backgroundColor: '#1e293b',
          borderRadius: '8px',
          border: '1px solid #334155'
        }}>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>Loading export data...</p>
        </div>
      ) : error ? (
        <div style={{
          textAlign: 'center',
          padding: '32px',
          color: '#ef4444',
          backgroundColor: '#1e293b',
          borderRadius: '8px',
          border: '1px solid #334155'
        }}>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>Error: {error}</p>
          <button
            onClick={handleRefresh}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              marginTop: '8px',
            }}
          >
            🔄 Retry
          </button>
        </div>
      ) : !exportData ? (
        <div style={{
          textAlign: 'center',
          padding: '32px',
          color: '#94a3b8',
          backgroundColor: '#1e293b',
          borderRadius: '8px',
          border: '1px solid #334155'
        }}>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>No execution data available</p>
          <p style={{ fontSize: '14px' }}>Run a task to generate exportable execution plan</p>
          <button
            onClick={handleRefresh}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              marginTop: '8px',
            }}
          >
            🔄 Check for Data
          </button>
        </div>
      ) : (
        <>
          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button
              onClick={handleCopyToClipboard}
              disabled={isTaskRunning || !exportData}
              style={{
                padding: '8px 16px',
                backgroundColor: copySuccess ? '#059669' : (isTaskRunning || !exportData ? '#4b5563' : '#3b82f6'),
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: (isTaskRunning || !exportData) ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.2s',
                opacity: (isTaskRunning || !exportData) ? 0.6 : 1,
              }}
            >
              {copySuccess ? '✓ Copied!' : '📋 Copy to Clipboard'}
            </button>

            <button
              onClick={handleDownload}
              disabled={isTaskRunning || !exportData}
              style={{
                padding: '8px 16px',
                backgroundColor: (isTaskRunning || !exportData) ? '#4b5563' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: (isTaskRunning || !exportData) ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.2s',
                opacity: (isTaskRunning || !exportData) ? 0.6 : 1,
              }}
            >
              💾 Download JSON
            </button>

            <button
              onClick={handleRefresh}
              disabled={isTaskRunning}
              style={{
                padding: '8px 16px',
                backgroundColor: isTaskRunning ? '#4b5563' : '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: isTaskRunning ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.2s',
                opacity: isTaskRunning ? 0.6 : 1,
              }}
            >
              🔄 Refresh
            </button>
          </div>

          {/* Export Summary */}
          <div style={{
            padding: '12px',
            backgroundColor: '#1e293b',
            borderRadius: '6px',
            border: '1px solid #334155',
            marginBottom: '16px',
          }}>
            <div style={{ fontSize: '14px', color: '#e2e8f0' }}>
              <div style={{ marginBottom: '4px' }}>
                <strong>Instruction:</strong> {exportData?.globalObjective || 'N/A'}
              </div>
              <div style={{ marginBottom: '4px' }}>
                <strong>Steps:</strong> {exportData?.totalSteps || 0}
              </div>
              <div style={{ marginBottom: '4px' }}>
                <strong>Status:</strong>
                <span style={{
                  color: exportData?.success ? '#10b981' : '#ef4444',
                  marginLeft: '8px'
                }}>
                  {exportData?.success ? '✓ Success' : '✗ Failed'}
                </span>
              </div>
              <div>
                <strong>Sub-plans:</strong> {exportData?.subPlans?.length || 0}
              </div>
            </div>
          </div>

          {/* JSON Preview */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#ffffff' }}>
              JSON Preview
            </h3>
            <div style={{
              flex: 1,
              overflow: 'auto',
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '6px',
              padding: '12px',
            }}>
              <pre style={{
                margin: 0,
                fontSize: '12px',
                lineHeight: '1.4',
                color: '#e2e8f0',
                fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {jsonString}
              </pre>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
