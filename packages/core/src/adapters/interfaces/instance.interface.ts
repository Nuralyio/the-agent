import { PageInstance } from './page.interface';

/**
 * Browser instance interface
 */
export interface BrowserInstance {
  id: string;
  version(): string;
  isConnected(): boolean;
  createPage(url?: string): Promise<PageInstance>;
  close(): Promise<void>;
}
