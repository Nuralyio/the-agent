import { BrowserType } from '@theagent/core';

export function getBrowserType(browser: string): BrowserType {
  switch (browser.toLowerCase()) {
    case 'chrome':
    case 'chromium':
      return BrowserType.CHROMIUM;
    case 'firefox':
      return BrowserType.FIREFOX;
    case 'safari':
    case 'webkit':
      return BrowserType.WEBKIT;
    case 'edge':
      return BrowserType.CHROMIUM;
    default:
      return BrowserType.CHROMIUM;
  }
}

export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  } else {
    return `${(ms / 60000).toFixed(1)}m`;
  }
}

export function validateUrl(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
}
