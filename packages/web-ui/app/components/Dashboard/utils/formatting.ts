import React from 'react';
import { 
  CheckmarkCircle20Regular, 
  Clock20Regular, 
  ErrorCircle20Regular, 
  Circle20Regular 
} from '@fluentui/react-icons';

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export const getStepIcon = (status: string, stepIndex: number) => {
  if (status === 'completed') return React.createElement(CheckmarkCircle20Regular);
  if (status === 'running' || stepIndex === stepIndex) return React.createElement(Clock20Regular);
  if (status === 'error') return React.createElement(ErrorCircle20Regular);
  return React.createElement(Circle20Regular);
};

export const getStepStatusText = (status: string, stepIndex: number): string => {
  if (status === 'completed') return 'Completed';
  if (status === 'running' || stepIndex === stepIndex) return 'In Progress';
  if (status === 'error') return 'Error';
  return 'Pending';
};

export const copyToClipboard = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
    // You could add a toast notification here
  } catch (err) {
    // Fallback for browsers that don't support clipboard API
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
};
