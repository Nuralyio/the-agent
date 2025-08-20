
/**
 * Content Extractor - Converts HTML to Emmet syntax for efficient AI processing
 *
 * This utility transforms HTML documents into compact Emmet abbreviations,
 * making them more suitable for AI analysis while preserving structural information.
 */

import { JSDOM } from 'jsdom';
export class ContentExtractor {
  /**
   * Extract structured content from page HTML
   */
  extractStructuredContent(html: string): string {
    if (!html) return 'No page content available';
    return this.htmlToEmmet(this.removeScriptsAndStyles(html));
  }

  /**
   * Convert HTML to Emmet abbreviation for more token-efficient representation
   */
  private htmlToEmmet(html: string): string {
    if (!html || typeof html !== 'string') return '';

    try {
      const dom = new JSDOM(html);
      const doc = dom.window.document;
      const result = this.convertElementToEmmet(doc.documentElement);
      return result;
    } catch (error) {
      console.warn('Failed to parse HTML with JSDOM:', error);
      return html;
    }
  }

  /**
   * Convert a DOM element to Emmet syntax recursively
   */
  private convertElementToEmmet(element: Element): string {
    if (!element) return '';

    const tagName = element.tagName.toLowerCase();
    const attributes = this.parseElementAttributes(element);

    const voidTags = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
    if (voidTags.includes(tagName)) {
      return `${tagName}${attributes}`;
    }

    const children: string[] = [];
    let hasTextContent = false;

    for (const child of Array.from(element.childNodes)) {
      if (child.nodeType === 3) {
        const text = child.textContent?.trim();
        if (text) {
          hasTextContent = true;
          const truncatedText = text.length > 100 ? text.substring(0, 100) + '...' : text;
          children.push(`{${truncatedText}}`);
        }
      } else if (child.nodeType === 1) {
        const childEmmet = this.convertElementToEmmet(child as Element);
        if (childEmmet) {
          children.push(childEmmet);
        }
      }
    }

    let result = `${tagName}${attributes}`;

    if (children.length > 0) {
      if (children.length === 1 && hasTextContent && children[0].startsWith('{')) {
        result += children[0];
      } else {
        result += '>' + children.join('+');
      }
    }

    return result;
  }

  /**
   * Parse element attributes to Emmet format
   */
  private parseElementAttributes(element: Element): string {
    const result: string[] = [];

    const id = element.getAttribute('id');
    if (id) {
      result.push(`#${id}`);
    }

    const className = element.getAttribute('class');
    if (className) {
      const classes = className.split(/\s+/).filter(c => c.trim());
      result.push(...classes.map(c => `.${c}`));
    }

    const importantAttrs = ['src', 'href', 'type', 'name', 'value', 'placeholder', 'alt', 'title'];
    for (const attr of importantAttrs) {
      const value = element.getAttribute(attr);
      if (value) {
        const truncatedValue = value.length > 50 ? value.substring(0, 50) + '...' : value;
        result.push(`[${attr}="${truncatedValue}"]`);
      }
    }

    return result.join('');
  }

  /**
   * Remove scripts and styles from HTML
   */
  private removeScriptsAndStyles(html: string): string {
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * For backwards compatibility with existing code
   */
  getAllContent(html: string): { structure: string; forms: string; interactions: string } {
    const emmetStructure = this.extractStructuredContent(html);
    return {
      structure: emmetStructure,
      forms: '',
      interactions: ''
    };
  }
}
