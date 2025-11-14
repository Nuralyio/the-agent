/**
 * Types and interfaces for content extraction
 */

/**
 * Visibility state of an element
 */
export interface VisibilityState {
  isVisible: boolean;
  isInViewport: boolean;
  hasSize: boolean;
  isInteractive: boolean;
  displayStyle: string;
  visibilityStyle: string;
  opacity: number;
  bounds: DOMRect | null;
}

/**
 * Accessibility information for an element
 */
export interface AccessibilityInfo {
  role: string | null;
  name: string | null;
  description: string | null;
  value: string | null;
  disabled: boolean;
  focused: boolean;
  readonly: boolean;
  required: boolean;
  level: number | null;
  checked: boolean | null;
  pressed: boolean | null;
  expanded: boolean | null;
  selected: boolean | null;
}

/**
 * Extracted element content
 */
export interface ExtractedElement {
  text: string;
  tagName: string;
  selector: string;
  visibility: VisibilityState;
  accessibility: AccessibilityInfo;
  attributes: Record<string, string>;
  children: ExtractedElement[];
}

/**
 * Extracted page content
 */
export interface ExtractedContent {
  title: string;
  url: string;
  mainContent: ExtractedElement[];
  interactiveElements: ExtractedElement[];
  headings: ExtractedElement[];
  links: ExtractedElement[];
  forms: ExtractedElement[];
  timestamp: Date;
  metadata: {
    totalElements: number;
    visibleElements: number;
    interactiveElements: number;
    hasFrames: boolean;
    hasShadowDOM: boolean;
  };
}

/**
 * Options for content extraction
 */
export interface ExtractionOptions {
  includeHidden?: boolean;
  maxDepth?: number;
  includeStyles?: boolean;
  includeAttributes?: boolean;
  filterByRole?: string[];
  excludeSelectors?: string[];
  includeFrames?: boolean;
  includeShadowDOM?: boolean;
  timeout?: number;
}

/**
 * Result of frame extraction
 */
export interface FrameExtractionResult {
  frameId: string;
  frameName: string;
  frameUrl: string;
  content: ExtractedContent;
}

/**
 * Complete extraction result including frames
 */
export interface CompleteExtractionResult {
  mainFrame: ExtractedContent;
  frames: FrameExtractionResult[];
  extractionTime: number;
  options: ExtractionOptions;
}
