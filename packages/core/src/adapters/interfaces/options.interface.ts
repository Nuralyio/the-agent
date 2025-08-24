/**
 * Browser types and configuration options
 */

import { Viewport, ProxyConfig, VideoConfig, ClipArea, WaitOptions } from './types';

export enum BrowserType {
  CHROME = 'chrome',
  CHROMIUM = 'chromium',
  FIREFOX = 'firefox',
  WEBKIT = 'webkit',
  SAFARI = 'safari',
  EDGE = 'edge'
}

export interface LaunchOptions {
  headless?: boolean;
  devtools?: boolean;
  args?: string[];
  slowMo?: number;
  timeout?: number;
  viewport?: Viewport;
  userAgent?: string;
  locale?: string;
  timezone?: string;
  proxy?: string | ProxyConfig;
  executablePath?: string;
  recordVideo?: VideoConfig;
}

export interface ScreenshotOptions {
  path?: string;
  fullPage?: boolean;
  quality?: number;
  type?: 'png' | 'jpeg' | 'webp';
  clip?: ClipArea;
  omitBackground?: boolean;
}

export interface VideoRecordingOptions {
  dir?: string;
  size?: Viewport;
  aspectRatio?: Viewport;
  mode?: 'record-on-failure' | 'retain-on-failure' | 'record-and-replay';
}
