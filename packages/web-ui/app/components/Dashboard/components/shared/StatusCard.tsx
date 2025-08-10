import React from 'react';
import { styles } from '../../Dashboard.styles';

interface StatusCardProps {
  title: string;
  status: 'online' | 'offline' | 'warning';
  description: string;
}

export const StatusCard: React.FC<StatusCardProps> = ({ title, status, description }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return '#10a37f';
      case 'offline':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  return (
    <div style={styles.settingsCard}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ ...styles.statusIndicator, backgroundColor: getStatusColor() }}></span>
        <strong style={{ color: '#e5e7eb' }}>{title}</strong>
      </div>
      <p style={{ color: '#9ca3af', margin: '0', fontSize: '13px' }}>
        {description}
      </p>
    </div>
  );
};
