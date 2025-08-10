import React from 'react';
import type { ChatMessage } from '../../../Dashboard.types';
import { styles } from '../../../Dashboard.styles';
import { getStepIcon, getStepStatusText } from '../../../utils/formatting';

interface StepBubbleProps {
  message: ChatMessage;
}

export const StepBubble: React.FC<StepBubbleProps> = ({ message }) => {
  return (
    <div style={styles.stepBubble}>
      <div style={styles.stepHeader}>
        <span>{getStepIcon(message.status || 'pending', 0)}</span>
        <span style={styles.stepTitle}>{message.text}</span>
      </div>
      <div style={styles.stepDescription}>
        {message.description} • {getStepStatusText(message.status || 'pending', 0)}
      </div>
    </div>
  );
};
