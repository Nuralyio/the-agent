/**
 * Base content extractor with shared implementation
 * Reduces code duplication between Playwright and Puppeteer implementations
 */

import { ContentExtractor } from './extractor.interface';
import {
  ExtractedContent,
  ExtractionOptions,
  CompleteExtractionResult,
  VisibilityState,
  AccessibilityInfo,
  ExtractedElement,
  FrameExtractionResult,
} from './types';

/**
 * Abstract page interface for browser-agnostic operations
 */
export interface AbstractPage {
  evaluate<T>(pageFunction: (...args: any[]) => T, ...args: any[]): Promise<T>;
  title(): Promise<string>;
  url(): string;
  frames(): AbstractFrame[];
  mainFrame(): AbstractFrame;
}

/**
 * Abstract frame interface for browser-agnostic operations
 */
export interface AbstractFrame {
  evaluate<T>(pageFunction: (...args: any[]) => T, ...args: any[]): Promise<T>;
  url(): string;
  name(): string;
}

/**
 * Base content extractor implementation
 * Provides shared functionality for Playwright and Puppeteer extractors
 */
export abstract class BaseContentExtractor implements ContentExtractor {
  constructor(protected page: AbstractPage) {}

  /**
   * Extract content from the current page
   */
  async extractContent(options: ExtractionOptions = {}): Promise<ExtractedContent> {
    // Set default options
    const opts: ExtractionOptions = {
      includeHidden: false,
      maxDepth: 10,
      includeStyles: false,
      includeAttributes: false,
      includeShadowDOM: true,
      includeFrames: false,
      ...options,
    };

    // Inject and execute extraction script
    // Note: The extraction function is injected into the page context via page.evaluate
    // TypeScript cannot validate browser context code, so we use a type guard
    const result = await this.page.evaluate(
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      (extractOptions: ExtractionOptions) => {
        // Type guard to safely access window global
        interface WindowWithExtractor extends Window {
          extractPageContent?: (options: ExtractionOptions) => any;
        }
        const win = window as WindowWithExtractor;
        
        if (typeof win.extractPageContent !== 'function') {
          throw new Error('Extraction script not loaded - ensure extraction-script is injected');
        }
        return win.extractPageContent(extractOptions);
      },
      opts
    );

    const title = await this.page.title();
    const url = this.page.url();

    // Process and categorize extracted elements
    const mainContent = result.elements;
    const interactiveElements = this.filterInteractiveElements(mainContent);
    const headings = this.filterHeadings(mainContent);
    const links = this.filterLinks(mainContent);
    const forms = this.filterForms(mainContent);

    const extractedContent: ExtractedContent = {
      title,
      url,
      mainContent,
      interactiveElements,
      headings,
      links,
      forms,
      timestamp: new Date(),
      metadata: {
        totalElements: result.metadata.totalElements,
        visibleElements: result.metadata.visibleElements,
        interactiveElements: result.metadata.interactiveElements,
        hasFrames: await this.hasFrames(),
        hasShadowDOM: result.metadata.hasShadowDOM,
      },
    };

    return extractedContent;
  }

  /**
   * Extract content from all frames
   */
  async extractAllFrames(options: ExtractionOptions = {}): Promise<CompleteExtractionResult> {
    const startTime = Date.now();

    // Extract main frame content
    const mainFrame = await this.extractContent({
      ...options,
      includeFrames: false, // Don't recursively process frames
    });

    // Extract iframe content if requested
    const frames: FrameExtractionResult[] = [];

    if (options.includeFrames !== false) {
      const iframes = this.page.frames().filter((f) => f !== this.page.mainFrame());

      for (const frame of iframes) {
        try {
          const frameContent = await this.extractFrameContent(frame, options);
          if (frameContent) {
            frames.push(frameContent);
          }
        } catch (error) {
          // Skip frames that can't be accessed (CORS, etc.)
          console.warn(`Failed to extract content from frame: ${error}`);
        }
      }
    }

    const extractionTime = Date.now() - startTime;

    return {
      mainFrame,
      frames,
      extractionTime,
      options,
    };
  }

  /**
   * Extract content from a specific frame
   */
  private async extractFrameContent(
    frame: AbstractFrame,
    options: ExtractionOptions
  ): Promise<FrameExtractionResult | null> {
    try {
      const result = await frame.evaluate(
        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        (extractOptions: ExtractionOptions) => {
          interface WindowWithExtractor extends Window {
            extractPageContent?: (options: ExtractionOptions) => any;
          }
          const win = window as WindowWithExtractor;
          
          if (typeof win.extractPageContent !== 'function') {
            throw new Error('Extraction script not loaded - ensure extraction-script is injected');
          }
          return win.extractPageContent(extractOptions);
        },
        options
      );

      const frameUrl = frame.url();
      const frameName = frame.name() || 'unnamed';

      const mainContent = result.elements;
      const interactiveElements = this.filterInteractiveElements(mainContent);
      const headings = this.filterHeadings(mainContent);
      const links = this.filterLinks(mainContent);
      const forms = this.filterForms(mainContent);

      const content: ExtractedContent = {
        title: '', // Frames don't have their own title
        url: frameUrl,
        mainContent,
        interactiveElements,
        headings,
        links,
        forms,
        timestamp: new Date(),
        metadata: {
          totalElements: result.metadata.totalElements,
          visibleElements: result.metadata.visibleElements,
          interactiveElements: result.metadata.interactiveElements,
          hasFrames: false,
          hasShadowDOM: result.metadata.hasShadowDOM,
        },
      };

      return {
        frameId: frame.url(), // Use URL as ID
        frameName,
        frameUrl,
        content,
      };
    } catch (error) {
      console.warn(`Failed to extract frame content: ${error}`);
      return null;
    }
  }

  /**
   * Check visibility state of an element
   */
  async checkVisibility(selector: string): Promise<VisibilityState> {
    return this.page.evaluate((sel: string) => {
      const element = document.querySelector(sel);
      if (!element) {
        throw new Error(`Element not found: ${sel}`);
      }

      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();

      const isVisible =
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        parseFloat(style.opacity) > 0 &&
        rect.width > 0 &&
        rect.height > 0;

      const isInViewport =
        rect.top < window.innerHeight &&
        rect.bottom > 0 &&
        rect.left < window.innerWidth &&
        rect.right > 0;

      const hasSize = rect.width > 0 && rect.height > 0;

      const interactiveTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'LABEL'];
      const isInteractive =
        interactiveTags.includes(element.tagName) ||
        element.hasAttribute('onclick') ||
        element.hasAttribute('role') ||
        style.cursor === 'pointer';

      return {
        isVisible,
        isInViewport,
        hasSize,
        isInteractive,
        displayStyle: style.display,
        visibilityStyle: style.visibility,
        opacity: parseFloat(style.opacity),
        bounds: rect.toJSON
          ? rect.toJSON()
          : {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
              top: rect.top,
              right: rect.right,
              bottom: rect.bottom,
              left: rect.left,
            },
      };
    }, selector);
  }

  /**
   * Get accessibility information for an element
   */
  async getAccessibilityInfo(selector: string): Promise<AccessibilityInfo> {
    return this.page.evaluate((sel: string) => {
      const element = document.querySelector(sel);
      if (!element) {
        throw new Error(`Element not found: ${sel}`);
      }

      const role = element.getAttribute('role') || element.tagName.toLowerCase();
      const ariaLabel = element.getAttribute('aria-label');
      const ariaLabelledBy = element.getAttribute('aria-labelledby');
      const ariaDescribedBy = element.getAttribute('aria-describedby');

      let name = ariaLabel;
      if (!name && ariaLabelledBy) {
        const labelElement = document.getElementById(ariaLabelledBy);
        name = labelElement?.textContent?.trim() || null;
      }
      if (!name && element instanceof HTMLInputElement) {
        const label = document.querySelector(`label[for="${element.id}"]`);
        name = label?.textContent?.trim() || null;
      }
      if (!name) {
        name = element.textContent?.trim().substring(0, 50) || null;
      }

      let description = null;
      if (ariaDescribedBy) {
        const descElement = document.getElementById(ariaDescribedBy);
        description = descElement?.textContent?.trim() || null;
      }

      let value = null;
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        value = element.value;
      } else if (element instanceof HTMLSelectElement) {
        value = element.options[element.selectedIndex]?.text || null;
      }

      const disabled =
        element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true';
      const focused = document.activeElement === element;
      const readonly =
        element.hasAttribute('readonly') || element.getAttribute('aria-readonly') === 'true';
      const required =
        element.hasAttribute('required') || element.getAttribute('aria-required') === 'true';

      let level: number | null = null;
      const ariaLevel = element.getAttribute('aria-level');
      if (ariaLevel) {
        level = parseInt(ariaLevel, 10);
      } else if (element.tagName.match(/^H[1-6]$/)) {
        level = parseInt(element.tagName[1], 10);
      }

      const checked =
        element.getAttribute('aria-checked') === 'true' ||
        (element instanceof HTMLInputElement && element.checked);
      const pressed = element.getAttribute('aria-pressed') === 'true' || null;
      const expanded = element.getAttribute('aria-expanded') === 'true' || null;
      const selected = element.getAttribute('aria-selected') === 'true' || null;

      return {
        role,
        name,
        description,
        value,
        disabled,
        focused,
        readonly,
        required,
        level,
        checked: typeof checked === 'boolean' ? checked : null,
        pressed,
        expanded,
        selected,
      };
    }, selector);
  }

  /**
   * Extract only visible text nodes from the page
   */
  async extractVisibleText(options: ExtractionOptions = {}): Promise<string[]> {
    return this.page.evaluate(
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      (extractOptions: ExtractionOptions) => {
        interface WindowWithExtractor extends Window {
          extractVisibleText?: (options: ExtractionOptions) => string[];
        }
        const win = window as WindowWithExtractor;
        
        if (typeof win.extractVisibleText !== 'function') {
          throw new Error('Extraction script not loaded - ensure extraction-script is injected');
        }
        return win.extractVisibleText(extractOptions);
      }, 
      options
    );
  }

  /**
   * Extract interactive elements
   */
  async extractInteractiveElements(
    options: ExtractionOptions = {}
  ): Promise<ExtractedElement[]> {
    const content = await this.extractContent(options);
    return content.interactiveElements;
  }

  /**
   * Helper: Check if page has frames
   */
  private async hasFrames(): Promise<boolean> {
    return this.page.frames().length > 1;
  }

  /**
   * Helper: Filter interactive elements from extracted content
   */
  protected filterInteractiveElements(elements: ExtractedElement[]): ExtractedElement[] {
    const interactive: ExtractedElement[] = [];

    const traverse = (el: ExtractedElement) => {
      if (el.visibility.isInteractive) {
        interactive.push(el);
      }
      el.children.forEach(traverse);
    };

    elements.forEach(traverse);
    return interactive;
  }

  /**
   * Helper: Filter headings from extracted content
   */
  protected filterHeadings(elements: ExtractedElement[]): ExtractedElement[] {
    const headings: ExtractedElement[] = [];

    const traverse = (el: ExtractedElement) => {
      if (el.tagName.match(/^h[1-6]$/)) {
        headings.push(el);
      }
      el.children.forEach(traverse);
    };

    elements.forEach(traverse);
    return headings;
  }

  /**
   * Helper: Filter links from extracted content
   */
  protected filterLinks(elements: ExtractedElement[]): ExtractedElement[] {
    const links: ExtractedElement[] = [];

    const traverse = (el: ExtractedElement) => {
      if (el.tagName === 'a') {
        links.push(el);
      }
      el.children.forEach(traverse);
    };

    elements.forEach(traverse);
    return links;
  }

  /**
   * Helper: Filter forms from extracted content
   */
  protected filterForms(elements: ExtractedElement[]): ExtractedElement[] {
    const forms: ExtractedElement[] = [];

    const traverse = (el: ExtractedElement) => {
      if (el.tagName === 'form' || el.tagName === 'input' || el.tagName === 'select' || el.tagName === 'textarea') {
        forms.push(el);
      }
      el.children.forEach(traverse);
    };

    elements.forEach(traverse);
    return forms;
  }
}
