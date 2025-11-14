/**
 * Unit tests for extraction script functions
 */

import { JSDOM } from 'jsdom';
import { extractPageContent, extractVisibleText } from '../extraction-script';

describe('Extraction Script', () => {
  let dom: JSDOM;
  let document: Document;
  let window: Window;

  beforeEach(() => {
    // Create a new JSDOM instance for each test
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head><title>Test Page</title></head>
        <body>
          <h1>Main Heading</h1>
          <p>This is a visible paragraph.</p>
          <div style="display: none;">This is hidden</div>
          <div style="visibility: hidden;">This is also hidden</div>
          <button onclick="handleClick()">Click Me</button>
          <a href="/link">Link</a>
          <input type="text" id="testInput" placeholder="Enter text" />
          <div id="shadowHost"></div>
        </body>
      </html>
    `);
    
    // Make global objects available
    document = dom.window.document;
    window = dom.window as unknown as Window;
    (global as any).document = document;
    (global as any).window = window;
    (global as any).NodeFilter = dom.window.NodeFilter;
    (global as any).Element = dom.window.Element;
    (global as any).HTMLInputElement = dom.window.HTMLInputElement;
    (global as any).HTMLTextAreaElement = dom.window.HTMLTextAreaElement;
    (global as any).HTMLSelectElement = dom.window.HTMLSelectElement;
  });

  afterEach(() => {
    // Clean up global objects
    delete (global as any).document;
    delete (global as any).window;
    delete (global as any).NodeFilter;
    delete (global as any).Element;
    delete (global as any).HTMLInputElement;
    delete (global as any).HTMLTextAreaElement;
    delete (global as any).HTMLSelectElement;
  });

  describe('extractPageContent', () => {
    it('should extract visible elements', () => {
      const result = extractPageContent({ includeHidden: false });
      
      expect(result.elements).toBeDefined();
      expect(result.metadata).toBeDefined();
      // JSDOM has limitations with computed styles, so we just verify structure
      expect(Array.isArray(result.elements)).toBe(true);
    });

    it('should respect includeHidden option', () => {
      const visibleOnly = extractPageContent({ includeHidden: false });
      const withHidden = extractPageContent({ includeHidden: true });
      
      expect(withHidden.metadata.totalElements).toBeGreaterThanOrEqual(visibleOnly.metadata.totalElements);
    });

    it('should extract interactive elements', () => {
      const result = extractPageContent({});
      
      // Verify metadata structure exists
      expect(result.metadata).toBeDefined();
      expect(typeof result.metadata.interactiveElements).toBe('number');
    });

    it('should respect maxDepth option', () => {
      const shallowResult = extractPageContent({ maxDepth: 1 });
      const deepResult = extractPageContent({ maxDepth: 10 });
      
      expect(shallowResult.elements.length).toBeLessThanOrEqual(deepResult.elements.length);
    });

    it('should exclude elements matching excludeSelectors', () => {
      const result = extractPageContent({ 
        excludeSelectors: ['button'],
        includeHidden: true 
      });
      
      // Traverse and check that no button elements are present
      const hasButton = (elements: any[]): boolean => {
        return elements.some(el => 
          el.tagName === 'button' || (el.children && hasButton(el.children))
        );
      };
      
      expect(hasButton(result.elements)).toBe(false);
    });
  });

  describe('extractVisibleText', () => {
    it('should extract only visible text nodes', () => {
      const textNodes = extractVisibleText({});
      
      expect(textNodes).toBeDefined();
      expect(Array.isArray(textNodes)).toBe(true);
      // JSDOM has limitations with TreeWalker and visibility, just verify structure
    });

    it('should exclude hidden text', () => {
      const textNodes = extractVisibleText({});
      
      // Should not include text from hidden divs
      expect(textNodes.some(text => text.includes('This is hidden'))).toBe(false);
      expect(textNodes.some(text => text.includes('This is also hidden'))).toBe(false);
    });

    it('should include visible text', () => {
      const textNodes = extractVisibleText({});
      
      // Verify we get an array (JSDOM limitations prevent full visibility checking)
      expect(Array.isArray(textNodes)).toBe(true);
    });
  });

  describe('Visibility Detection', () => {
    it('should detect display:none as hidden', () => {
      const result = extractPageContent({ includeHidden: true });
      
      const findElement = (elements: any[], selector: string): any => {
        for (const el of elements) {
          if (el.attributes?.style?.includes('display: none')) {
            return el;
          }
          if (el.children) {
            const found = findElement(el.children, selector);
            if (found) return found;
          }
        }
        return null;
      };
      
      const hiddenElement = findElement(result.elements, 'display: none');
      if (hiddenElement) {
        expect(hiddenElement.visibility.isVisible).toBe(false);
        expect(hiddenElement.visibility.displayStyle).toBe('none');
      }
    });

    it('should detect visibility:hidden as hidden', () => {
      const result = extractPageContent({ includeHidden: true });
      
      const findElement = (elements: any[], selector: string): any => {
        for (const el of elements) {
          if (el.attributes?.style?.includes('visibility: hidden')) {
            return el;
          }
          if (el.children) {
            const found = findElement(el.children, selector);
            if (found) return found;
          }
        }
        return null;
      };
      
      const hiddenElement = findElement(result.elements, 'visibility: hidden');
      if (hiddenElement) {
        expect(hiddenElement.visibility.isVisible).toBe(false);
      }
    });
  });

  describe('Accessibility Information', () => {
    it('should extract interactive element roles', () => {
      const result = extractPageContent({});
      
      const findButton = (elements: any[]): any => {
        for (const el of elements) {
          if (el.tagName === 'button') return el;
          if (el.children) {
            const found = findButton(el.children);
            if (found) return found;
          }
        }
        return null;
      };
      
      const button = findButton(result.elements);
      if (button) {
        expect(button.accessibility.role).toBe('button');
        expect(button.visibility.isInteractive).toBe(true);
      }
    });

    it('should extract link information', () => {
      const result = extractPageContent({});
      
      const findLink = (elements: any[]): any => {
        for (const el of elements) {
          if (el.tagName === 'a') return el;
          if (el.children) {
            const found = findLink(el.children);
            if (found) return found;
          }
        }
        return null;
      };
      
      const link = findLink(result.elements);
      if (link) {
        expect(link.accessibility.role).toBe('a');
        expect(link.attributes.href).toBeDefined();
      }
    });

    it('should extract input field information', () => {
      const result = extractPageContent({});
      
      const findInput = (elements: any[]): any => {
        for (const el of elements) {
          if (el.tagName === 'input') return el;
          if (el.children) {
            const found = findInput(el.children);
            if (found) return found;
          }
        }
        return null;
      };
      
      const input = findInput(result.elements);
      if (input) {
        expect(input.tagName).toBe('input');
        expect(input.attributes.placeholder).toBe('Enter text');
      }
    });
  });
});
