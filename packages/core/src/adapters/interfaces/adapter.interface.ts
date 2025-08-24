import { BrowserInstance } from './instance.interface';
import { BrowserType, LaunchOptions } from './options.interface';

/**
 * Browser adapter interface
 */
export interface BrowserAdapter {
  name: string;
  type: BrowserType;
  launch(options?: LaunchOptions): Promise<BrowserInstance>;
  isAvailable(): Promise<boolean>;
  getSupportedBrowsers(): BrowserType[];
  getDefaultOptions(): LaunchOptions;
}
