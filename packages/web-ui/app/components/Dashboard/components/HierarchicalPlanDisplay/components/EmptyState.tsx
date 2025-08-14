import React from 'react';

interface EmptyStateProps {
  message?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message = 'No hierarchical plan available. The system will create one for complex tasks.',
}) => {
  const styles = {
    container: {
      textAlign: 'center' as const,
      color: '#6b7280',
      padding: '32px',
      fontSize: '14px',
      backgroundColor: '#1a1a1a',
      border: '1px solid #374151',
      borderRadius: '8px',
      margin: '8px 0',
    },
  };

  return <div style={styles.container}>{message}</div>;
};
