/**
 * Client-side extraction script to be injected into the browser
 * This script runs in the browser context and performs DOM traversal,
 * visibility checks, and accessibility information gathering
 */

export interface DOMRect {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
}

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

export interface ExtractedElement {
  text: string;
  tagName: string;
  selector: string;
  visibility: VisibilityState;
  accessibility: AccessibilityInfo;
  attributes: Record<string, string>;
  children: ExtractedElement[];
}

export interface ExtractionOptions {
  includeHidden?: boolean;
  maxDepth?: number;
  includeStyles?: boolean;
  includeAttributes?: boolean;
  filterByRole?: string[];
  excludeSelectors?: string[];
  includeShadowDOM?: boolean;
}

/**
 * Generate a unique CSS selector for an element
 */
function generateSelector(element: Element): string {
  if (element.id) {
    return `#${element.id}`;
  }

  const path: string[] = [];
  let current: Element | null = element;

  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();

    if (current.className && typeof current.className === 'string') {
      const classes = current.className.trim().split(/\s+/).filter(c => c);
      if (classes.length > 0) {
        selector += '.' + classes.join('.');
      }
    }

    // Add nth-child if needed for uniqueness
    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        child => child.tagName === current!.tagName
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-child(${index})`;
      }
    }

    path.unshift(selector);
    current = current.parentElement;
  }

  return path.join(' > ');
}

/**
 * Check if an element is visible
 */
function checkElementVisibility(element: Element): VisibilityState {
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
    bounds: rect.toJSON ? rect.toJSON() : {
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
}

/**
 * Get accessibility information for an element
 */
function getAccessibilityInfo(element: Element): AccessibilityInfo {
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

  const disabled = element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true';
  const focused = document.activeElement === element;
  const readonly = element.hasAttribute('readonly') || element.getAttribute('aria-readonly') === 'true';
  const required = element.hasAttribute('required') || element.getAttribute('aria-required') === 'true';

  let level: number | null = null;
  const ariaLevel = element.getAttribute('aria-level');
  if (ariaLevel) {
    level = parseInt(ariaLevel, 10);
  } else if (element.tagName.match(/^H[1-6]$/)) {
    level = parseInt(element.tagName[1], 10);
  }

  const checked = element.getAttribute('aria-checked') === 'true' || (element instanceof HTMLInputElement && element.checked);
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
}

/**
 * Extract attributes from an element
 */
function extractAttributes(element: Element, includeAll: boolean): Record<string, string> {
  const attrs: Record<string, string> = {};

  if (includeAll) {
    for (const attr of element.attributes) {
      attrs[attr.name] = attr.value;
    }
  } else {
    // Only include important attributes
    const importantAttrs = ['id', 'class', 'type', 'name', 'value', 'href', 'src', 'alt', 'title', 'placeholder'];
    for (const attrName of importantAttrs) {
      const value = element.getAttribute(attrName);
      if (value !== null) {
        attrs[attrName] = value;
      }
    }
  }

  return attrs;
}

/**
 * Process shadow DOM
 */
function processShadowDOM(element: Element, options: ExtractionOptions, depth: number): ExtractedElement[] {
  const shadowRoot = (element as any).shadowRoot;
  if (!shadowRoot || !options.includeShadowDOM) {
    return [];
  }

  const shadowElements: ExtractedElement[] = [];
  const children = Array.from(shadowRoot.children);

  for (const child of children) {
    if (child instanceof Element) {
      const extracted = extractElement(child, options, depth + 1);
      if (extracted) {
        shadowElements.push(extracted);
      }
    }
  }

  return shadowElements;
}

/**
 * Extract information from a single element
 */
function extractElement(element: Element, options: ExtractionOptions, depth: number): ExtractedElement | null {
  const maxDepth = options.maxDepth ?? 10;
  if (depth > maxDepth) {
    return null;
  }

  // Check if element should be excluded
  if (options.excludeSelectors) {
    for (const excludeSelector of options.excludeSelectors) {
      if (element.matches(excludeSelector)) {
        return null;
      }
    }
  }

  const visibility = checkElementVisibility(element);

  // Skip hidden elements unless includeHidden is true
  if (!visibility.isVisible && !options.includeHidden) {
    return null;
  }

  const accessibility = getAccessibilityInfo(element);

  // Filter by role if specified
  if (options.filterByRole && options.filterByRole.length > 0) {
    if (!accessibility.role || !options.filterByRole.includes(accessibility.role)) {
      return null;
    }
  }

  const text = element.textContent?.trim() || '';
  const tagName = element.tagName.toLowerCase();
  const selector = generateSelector(element);
  const attributes = extractAttributes(element, options.includeAttributes ?? false);

  // Extract children
  const children: ExtractedElement[] = [];

  // Process regular children
  for (const child of element.children) {
    const extracted = extractElement(child, options, depth + 1);
    if (extracted) {
      children.push(extracted);
    }
  }

  // Process shadow DOM if enabled
  const shadowChildren = processShadowDOM(element, options, depth);
  children.push(...shadowChildren);

  return {
    text,
    tagName,
    selector,
    visibility,
    accessibility,
    attributes,
    children,
  };
}

/**
 * Main extraction function to be called from the browser context
 */
export function extractPageContent(options: ExtractionOptions = {}): {
  elements: ExtractedElement[];
  metadata: {
    totalElements: number;
    visibleElements: number;
    interactiveElements: number;
    hasShadowDOM: boolean;
  };
} {
  const elements: ExtractedElement[] = [];
  let totalElements = 0;
  let visibleElements = 0;
  let interactiveElements = 0;
  let hasShadowDOM = false;

  // Start extraction from body
  const bodyChildren = Array.from(document.body.children);

  for (const child of bodyChildren) {
    if (child instanceof Element) {
      const extracted = extractElement(child, options, 0);
      if (extracted) {
        elements.push(extracted);
        totalElements++;
        if (extracted.visibility.isVisible) {
          visibleElements++;
        }
        if (extracted.visibility.isInteractive) {
          interactiveElements++;
        }
      }
    }
  }

  // Check for shadow DOM
  const elementsWithShadow = document.querySelectorAll('*');
  for (const el of elementsWithShadow) {
    if ((el as any).shadowRoot) {
      hasShadowDOM = true;
      break;
    }
  }

  return {
    elements,
    metadata: {
      totalElements,
      visibleElements,
      interactiveElements,
      hasShadowDOM,
    },
  };
}

/**
 * Extract only visible text from the page
 */
export function extractVisibleText(options: ExtractionOptions = {}): string[] {
  const textNodes: string[] = [];
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;

        const visibility = checkElementVisibility(parent);
        if (!visibility.isVisible) return NodeFilter.FILTER_REJECT;

        const text = node.textContent?.trim();
        if (!text || text.length === 0) return NodeFilter.FILTER_REJECT;

        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  let node;
  while ((node = walker.nextNode())) {
    const text = node.textContent?.trim();
    if (text) {
      textNodes.push(text);
    }
  }

  return textNodes;
}
