import { BrowserType } from './options.interface';
import { PageInstance } from './page.interface';

/**
 * Browser instance interface
 */
export interface BrowserInstance {
  type: BrowserType;
  newPage(): Promise<PageInstance>;
  close(): Promise<void>;
  pages(): Promise<PageInstance[]>;
  createPage(url?: string): Promise<PageInstance>;
  isConnected(): boolean;
  version(): string;
}
