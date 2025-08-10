import React from 'react';
import { styles } from '../../../Dashboard.styles';

export const LogsTab: React.FC = () => {
  return (
    <div>
      <h2 style={styles.sectionTitle}>Execution Logs</h2>
      <div
        style={{
          ...styles.settingsCard,
          backgroundColor: '#000000',
          border: '1px solid #374151',
          fontFamily: 'Monaco, "Lucida Console", monospace',
          fontSize: '12px',
        }}
      >
        <div style={{ color: '#10a37f', marginBottom: '4px' }}>[INFO] System initialized successfully</div>
        <div style={{ color: '#9ca3af', marginBottom: '4px' }}>[INFO] Automation engine ready</div>
        <div style={{ color: '#9ca3af' }}>[INFO] Waiting for user input...</div>
      </div>
    </div>
  );
};
