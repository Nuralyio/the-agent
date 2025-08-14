// Status colors
export const STATUS_COLORS = {
  completed: '#10b981',
  running: '#3b82f6',
  error: '#ef4444',
  pending: '#6b7280',
  default: '#6b7280',
} as const;

// Status icons
export const STATUS_ICONS = {
  completed: '✅',
  running: '🔄',
  error: '❌',
  pending: '⭕',
  default: '⭕',
} as const;

// Step status icons
export const STEP_STATUS_ICONS = {
  completed: '✓',
  running: '▶',
  error: '✗',
  pending: '○',
  default: '○',
} as const;

// Common styles
export const COMMON_STYLES = {
  colors: {
    background: {
      primary: '#1a1a1a',
      secondary: '#374151',
      active: '#1e3a8a',
      hover: '#4b5563',
    },
    border: {
      primary: '#374151',
      secondary: '#4b5563',
      active: '#3b82f6',
      hover: '#6b7280',
    },
    text: {
      primary: '#ffffff',
      secondary: '#e5e7eb',
      muted: '#9ca3af',
      accent: '#10b981',
    },
  },
  borderRadius: {
    small: '4px',
    medium: '6px',
    large: '8px',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '32px',
  },
} as const;

export type StatusType = keyof typeof STATUS_COLORS;
