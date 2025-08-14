import React from 'react';
import { STATUS_COLORS, STATUS_ICONS, type StatusType } from '../constants';

interface StatusBadgeProps {
  status: string;
}

const getStatusColor = (status: string): string => {
  return STATUS_COLORS[status as StatusType] || STATUS_COLORS.default;
};

const getStatusIcon = (status: string): string => {
  return STATUS_ICONS[status as StatusType] || STATUS_ICONS.default;
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const statusColor = getStatusColor(status);

  return (
    <div
      style={{
        fontSize: '12px',
        fontWeight: '500',
        padding: '2px 8px',
        borderRadius: '4px',
        textTransform: 'uppercase' as const,
        backgroundColor: statusColor + '20',
        color: statusColor,
        border: `1px solid ${statusColor}40`,
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      <span>{getStatusIcon(status)}</span>
      {status}
    </div>
  );
};
