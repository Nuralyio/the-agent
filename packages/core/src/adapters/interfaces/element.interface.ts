/**
 * Element interface definitions
 */
export interface ElementHandle {
  click(): Promise<void>;
  type(text: string): Promise<void>;
  getText(): Promise<string>;
  getAttribute(name: string): Promise<string | null>;
  isVisible(): Promise<boolean>;
  hover(): Promise<void>;
  focus(): Promise<void>;
  scroll(): Promise<void>;
}
