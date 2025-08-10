import React from 'react';
import { styles } from '../../../Dashboard.styles';

export const ResultsTab: React.FC = () => {
  return (
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
  );
};
