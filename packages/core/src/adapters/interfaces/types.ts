/**
 * Common types for browser automation and configuration
 */

export type Viewport = {
  width: number;
  height: number;
};

export type ProxyConfig = {
  server: string;
  username?: string;
  password?: string;
  bypass?: string[];
};

export type VideoConfig = {
  dir: string;
  size?: Viewport;
};

export type ClipArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type WaitOptions = {
  timeout?: number;
  visible?: boolean;
  hidden?: boolean;
  state?: 'attached' | 'detached' | 'visible' | 'hidden';
};
