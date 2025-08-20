import { 
  Image20Regular, 
  Document20Regular 
} from '@fluentui/react-icons';

export const DEFAULT_ENGINE = 'playwright';
export const DEFAULT_TIMEOUT = 10;
export const DEFAULT_BROWSER_MODE = 'headed';
export const DEFAULT_VIEWPORT_SIZE = '1920x1080';
export const DEFAULT_USER_AGENT = 'default';

export const DEFAULT_TABS = [
  { id: 'preview', label: 'Preview Screenshot', icon: Image20Regular },
  // { id: 'logs', label: 'Logs', icon: Document20Regular },
];

export const INITIAL_CHAT_MESSAGES = [
  { id: 1, type: 'system' as const, text: "Welcome! I'm ready to help you automate browser tasks.", timestamp: new Date() },
  {
    id: 2,
    type: 'system' as const,
    text: "Configure your automation settings and describe what you'd like me to do.",
    timestamp: new Date(),
  },
];

export const AUTOMATION_SERVER_URL = 'http://localhost:3002';
