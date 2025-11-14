
/**
 * Content Extractor - Formats extracted content for AI processing
 *
 * This utility formats the visibility and accessibility-aware extracted content
 * into a structured format suitable for AI analysis.
 */

import { ExtractedContent, ExtractedElement } from '../../../extractors/types';

export class ContentExtractor {
  /**
   * Format extracted content for AI prompt
   * Converts the structured ExtractedContent into a readable format for LLM consumption
   */
  formatExtractedContent(extractedContent: ExtractedContent): string {
    const sections: string[] = [];

    // Page metadata
    sections.push('=== PAGE INFORMATION ===');
    sections.push(`Title: ${extractedContent.title}`);
    sections.push(`URL: ${extractedContent.url}`);
    sections.push('');

    // Statistics
    sections.push('=== PAGE STATISTICS ===');
    sections.push(`Total Elements: ${extractedContent.metadata.totalElements}`);
    sections.push(`Visible Elements: ${extractedContent.metadata.visibleElements}`);
    sections.push(`Interactive Elements: ${extractedContent.metadata.interactiveElements}`);
    sections.push('');

    // Headings structure
    if (extractedContent.headings.length > 0) {
      sections.push('=== PAGE STRUCTURE (Headings) ===');
      extractedContent.headings.forEach(heading => {
        const level = heading.accessibility.level || 1;
        let indent = '';
        for (let i = 1; i < level; i++) {
          indent += '  ';
        }
        sections.push(`${indent}${heading.tagName.toUpperCase()}: ${heading.text}`);
      });
      sections.push('');
    }

    // Interactive elements (buttons, inputs, etc.)
    if (extractedContent.interactiveElements.length > 0) {
      sections.push('=== INTERACTIVE ELEMENTS ===');
      const uniqueInteractive = this.deduplicateElements(extractedContent.interactiveElements);
      uniqueInteractive.slice(0, 50).forEach(element => {
        const elementInfo = this.formatElement(element);
        sections.push(elementInfo);
      });
      if (uniqueInteractive.length > 50) {
        sections.push(`... and ${uniqueInteractive.length - 50} more interactive elements`);
      }
      sections.push('');
    }

    // Links
    if (extractedContent.links.length > 0) {
      sections.push('=== LINKS ===');
      const uniqueLinks = this.deduplicateElements(extractedContent.links);
      uniqueLinks.slice(0, 30).forEach(link => {
        const href = link.attributes.href || '#';
        const text = link.text || link.accessibility.name || '(no text)';
        sections.push(`- ${text} → ${href}`);
        if (link.selector) {
          sections.push(`  Selector: ${link.selector}`);
        }
      });
      if (uniqueLinks.length > 30) {
        sections.push(`... and ${uniqueLinks.length - 30} more links`);
      }
      sections.push('');
    }

    // Forms
    if (extractedContent.forms.length > 0) {
      sections.push('=== FORM ELEMENTS ===');
      extractedContent.forms.slice(0, 30).forEach(form => {
        const elementInfo = this.formatElement(form);
        sections.push(elementInfo);
      });
      if (extractedContent.forms.length > 30) {
        sections.push(`... and ${extractedContent.forms.length - 30} more form elements`);
      }
      sections.push('');
    }

    return sections.join('\n');
  }

  /**
   * Format a single element for display
   */
  private formatElement(element: ExtractedElement): string {
    const parts: string[] = [];
    
    // Element type and text
    const text = element.text?.substring(0, 100) || element.accessibility.name || '';
    parts.push(`- ${element.tagName.toUpperCase()}: ${text}`);
    
    // Selector
    if (element.selector) {
      parts.push(`  Selector: ${element.selector}`);
    }
    
    // Accessibility info
    if (element.accessibility.role && element.accessibility.role !== element.tagName) {
      parts.push(`  Role: ${element.accessibility.role}`);
    }
    
    // Important attributes
    const importantAttrs = ['type', 'name', 'id', 'placeholder', 'value'];
    importantAttrs.forEach(attr => {
      if (element.attributes[attr]) {
        parts.push(`  ${attr}: ${element.attributes[attr]}`);
      }
    });
    
    // States
    if (element.accessibility.disabled) parts.push(`  State: disabled`);
    if (element.accessibility.required) parts.push(`  State: required`);
    if (element.accessibility.readonly) parts.push(`  State: readonly`);
    
    return parts.join('\n');
  }

  /**
   * Remove duplicate elements based on selector or text
   */
  private deduplicateElements(elements: ExtractedElement[]): ExtractedElement[] {
    const seen: { [key: string]: boolean } = {};
    return elements.filter(element => {
      const key = element.selector || `${element.tagName}:${element.text}`;
      if (seen[key]) {
        return false;
      }
      seen[key] = true;
      return true;
    });
  }

  /**
   * Legacy method for backward compatibility (deprecated)
   * @deprecated Use formatExtractedContent with ExtractedContent from page.getContentExtractor()
   */
  extractStructuredContent(html: string): string {
    // Fallback to a simple text extraction if HTML is provided
    if (!html) return 'No page content available';
    
    // Remove scripts and styles
    const cleaned = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return cleaned.substring(0, 5000);
  }
}
