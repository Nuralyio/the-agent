
/**
 * Content Extractor - Converts HTML to Emmet syntax for efficient AI processing
 *
 * This utility transforms HTML documents into compact Emmet abbreviations,
 * making them more suitable for AI analysis while preserving structural information.
 */

import { htmlToEmmet, removeScriptsAndStyles } from './emmet-utils';

export class ContentExtractor {
  /**
   * Extract structured content from page HTML
   */
  extractStructuredContent(html: string): string {
    if (!html) return 'No page content available';
    return htmlToEmmet(removeScriptsAndStyles(html));
  }
}
