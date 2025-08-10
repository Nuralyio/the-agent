import React from 'react';
import { styles } from '../../../Dashboard.styles';

interface StatusTabProps {
  selectedEngine: string;
}

export const StatusTab: React.FC<StatusTabProps> = ({ selectedEngine }) => {
  return (
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
  );
};
