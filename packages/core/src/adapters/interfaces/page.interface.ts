import { ElementHandle } from './element.interface';
import { ScreenshotOptions, VideoRecordingOptions } from './options.interface';
import { WaitOptions } from './types';

/**
 * Page instance interface
 */
export interface PageInstance {
  navigate(url: string): Promise<void>;
  getTitle(): Promise<string>;
  getUrl(): Promise<string>;
  screenshot(options?: ScreenshotOptions): Promise<Buffer>;
  findElement(selector: string): Promise<ElementHandle | null>;
  findElements(selector: string): Promise<ElementHandle[]>;
  waitForElement(selector: string, timeout?: number): Promise<ElementHandle>;
  close(): Promise<void>;
  content(): Promise<string>;
  click(selector: string): Promise<void>;
  type(selector: string, text: string): Promise<void>;
  waitForSelector(selector: string, options?: WaitOptions): Promise<ElementHandle>;
  evaluate<T>(fn: () => T): Promise<T>;
  waitForLoad(): Promise<void>;
  startVideoRecording(options?: VideoRecordingOptions): Promise<void>;
  stopVideoRecording(): Promise<string | null>;
  isVideoRecording(): boolean;
}
