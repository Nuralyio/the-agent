export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export const getStepIcon = (status: string, stepIndex: number): string => {
  if (status === 'completed') return '✅';
  if (status === 'running' || stepIndex === stepIndex) return '🔄';
  if (status === 'error') return '❌';
  return '⭕';
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
