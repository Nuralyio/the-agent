/**
 * Interface for content extraction
 */

import {
  ExtractedContent,
  ExtractionOptions,
  CompleteExtractionResult,
  VisibilityState,
  AccessibilityInfo,
} from './types';

/**
 * Content extractor interface
 */
export interface ContentExtractor {
  /**
   * Extract visible and accessible content from the current page
   * @param options Extraction options
   * @returns Extracted content
   */
  extractContent(options?: ExtractionOptions): Promise<ExtractedContent>;

  /**
   * Extract content from all frames (main frame + iframes)
   * @param options Extraction options
   * @returns Complete extraction result with all frames
   */
  extractAllFrames(options?: ExtractionOptions): Promise<CompleteExtractionResult>;

  /**
   * Check visibility state of an element
   * @param selector Element selector
   * @returns Visibility state
   */
  checkVisibility(selector: string): Promise<VisibilityState>;

  /**
   * Get accessibility information for an element
   * @param selector Element selector
   * @returns Accessibility information
   */
  getAccessibilityInfo(selector: string): Promise<AccessibilityInfo>;

  /**
   * Extract only visible text nodes from the page
   * @param options Extraction options
   * @returns Array of visible text content
   */
  extractVisibleText(options?: ExtractionOptions): Promise<string[]>;

  /**
   * Extract interactive elements (buttons, links, inputs, etc.)
   * @param options Extraction options
   * @returns Array of interactive elements
   */
  extractInteractiveElements(options?: ExtractionOptions): Promise<ExtractedContent['interactiveElements']>;
}
