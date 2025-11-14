# Content Extraction Module

The Content Extraction module provides visibility and accessibility-aware content extraction from web pages. It combines DOM traversal, CSS visibility checks, and accessibility tree queries to extract content as a user would perceive it.

## Features

- **Visibility Detection**: Filters out elements hidden by CSS (`display:none`, `visibility:hidden`, `opacity:0`) or with zero size
- **Accessibility Integration**: Extracts semantic roles, labels, states, and ARIA attributes
- **Frame Support**: Traverses and extracts content from iframes
- **Shadow DOM Support**: Handles modern web components with shadow DOM
- **Interactive Elements**: Identifies and categorizes buttons, links, inputs, and other interactive elements
- **Structured Output**: Organizes extracted content into categories (headings, links, forms, etc.)
- **Multi-Adapter**: Works with both Playwright and Puppeteer

## Architecture

### Core Components

1. **Types** (`types.ts`): TypeScript interfaces for structured content extraction
2. **Interface** (`extractor.interface.ts`): `ContentExtractor` interface definition
3. **Extraction Script** (`extraction-script.ts`): Client-side DOM traversal logic
4. **Playwright Implementation** (`playwright-extractor.ts`): Playwright-specific implementation
5. **Puppeteer Implementation** (`puppeteer-extractor.ts`): Puppeteer-specific implementation

### Integration

The extractor is integrated into the `PageInstance` interface via the `getContentExtractor()` method, making it available for all page instances regardless of the underlying browser adapter.

## Usage

### Basic Extraction

```typescript
import { TheAgent } from '@theagent/core';

const agent = new TheAgent({ adapter: 'playwright', headless: true });
await agent.initialize();

const page = await agent.browserManager.createPage('https://example.com');
const extractor = page.getContentExtractor();

const content = await extractor.extractContent();

console.log('Title:', content.title);
console.log('Headings:', content.headings.length);
console.log('Links:', content.links.length);
console.log('Interactive elements:', content.interactiveElements.length);
```

### Advanced Options

```typescript
const options = {
  includeHidden: false,        // Only visible elements
  maxDepth: 5,                 // Limit traversal depth
  includeShadowDOM: true,      // Include shadow DOM content
  includeFrames: true,         // Include iframe content
  filterByRole: ['button', 'link'], // Filter by ARIA roles
  excludeSelectors: ['.ad'],   // Exclude specific selectors
};

const content = await extractor.extractContent(options);
```

### Extract All Frames

```typescript
const result = await extractor.extractAllFrames({
  includeFrames: true,
  includeShadowDOM: true,
});

console.log('Main frame elements:', result.mainFrame.metadata.totalElements);
console.log('Iframes found:', result.frames.length);
console.log('Extraction time:', result.extractionTime, 'ms');
```

### Check Element Visibility

```typescript
const visibility = await extractor.checkVisibility('button#submit');

console.log('Is visible:', visibility.isVisible);
console.log('Is in viewport:', visibility.isInViewport);
console.log('Has size:', visibility.hasSize);
console.log('Is interactive:', visibility.isInteractive);
```

### Get Accessibility Information

```typescript
const a11yInfo = await extractor.getAccessibilityInfo('input#username');

console.log('Role:', a11yInfo.role);
console.log('Name:', a11yInfo.name);
console.log('Disabled:', a11yInfo.disabled);
console.log('Required:', a11yInfo.required);
```

### Extract Visible Text

```typescript
const textNodes = await extractor.extractVisibleText();

console.log('Visible text nodes:', textNodes.length);
textNodes.forEach(text => console.log('-', text));
```

### Extract Interactive Elements

```typescript
const interactive = await extractor.extractInteractiveElements();

interactive.forEach(element => {
  console.log(`${element.tagName}: ${element.accessibility.name}`);
});
```

## Types

### ExtractedContent

The main result type containing:

- `title`: Page title
- `url`: Page URL
- `mainContent`: Array of all extracted elements
- `interactiveElements`: Buttons, links, inputs, etc.
- `headings`: H1-H6 elements
- `links`: Anchor elements
- `forms`: Form and input elements
- `timestamp`: Extraction timestamp
- `metadata`: Statistics about the extraction

### VisibilityState

Information about element visibility:

- `isVisible`: Overall visibility (considers display, visibility, opacity, size)
- `isInViewport`: Whether element is in the current viewport
- `hasSize`: Whether element has non-zero dimensions
- `isInteractive`: Whether element is interactive (button, link, etc.)
- `displayStyle`: CSS display property value
- `visibilityStyle`: CSS visibility property value
- `opacity`: CSS opacity value
- `bounds`: Element bounding rectangle

### AccessibilityInfo

Accessibility attributes and states:

- `role`: ARIA role or tag name
- `name`: Accessible name (from aria-label, label element, or text content)
- `description`: Accessible description (from aria-describedby)
- `value`: Current value (for inputs)
- `disabled`: Whether element is disabled
- `focused`: Whether element currently has focus
- `readonly`: Whether element is read-only
- `required`: Whether element is required
- `level`: Heading level (for H1-H6)
- `checked`: Checkbox/radio state
- `pressed`: Button pressed state
- `expanded`: Element expanded state
- `selected`: Element selected state

### ExtractionOptions

Configuration options:

- `includeHidden`: Include hidden elements (default: false)
- `maxDepth`: Maximum traversal depth (default: 10)
- `includeStyles`: Include computed styles (default: false)
- `includeAttributes`: Include all attributes (default: false)
- `filterByRole`: Filter elements by ARIA roles
- `excludeSelectors`: CSS selectors to exclude
- `includeFrames`: Process iframes (default: true)
- `includeShadowDOM`: Process shadow DOM (default: true)
- `timeout`: Extraction timeout in milliseconds

## Implementation Details

### Client-Side Extraction

The extraction script runs in the browser context and performs:

1. **DOM Traversal**: Walks the DOM tree recursively
2. **Visibility Checks**: Uses `getComputedStyle()` and `getBoundingClientRect()` to determine visibility
3. **Accessibility Extraction**: Reads ARIA attributes and computes accessible names
4. **Shadow DOM Traversal**: Processes shadow roots when enabled
5. **Selector Generation**: Creates unique CSS selectors for each element

### Browser Integration

- Uses `page.evaluate()` to inject and execute extraction logic
- Works with both Playwright and Puppeteer APIs
- Supports frame traversal via frame APIs
- Handles cross-origin frame restrictions gracefully

### Performance Considerations

- Configurable depth limits prevent excessive traversal
- Selector exclusion allows skipping irrelevant content
- Shadow DOM processing can be disabled for better performance
- Frame extraction is optional and can be skipped

## Testing

Unit tests are provided in `__tests__/extraction-script.test.ts` covering:

- Basic content extraction
- Visibility detection
- Accessibility information extraction
- Option handling (includeHidden, maxDepth, excludeSelectors)
- Interactive element detection

Run tests with:

```bash
npm run test:unit -w packages/core
```

## Use Cases

### AI-Powered Automation

Extract visible content for LLM context:

```typescript
const content = await extractor.extractContent({ includeHidden: false });
const context = `
Page: ${content.title}
Headings: ${content.headings.map(h => h.text).join(', ')}
Interactive elements: ${content.interactiveElements.map(e => e.accessibility.name).join(', ')}
`;
```

### Web Scraping

Extract structured data from pages:

```typescript
const content = await extractor.extractContent({ 
  filterByRole: ['article', 'navigation'],
  excludeSelectors: ['.ad', '.sidebar']
});
```

### Accessibility Testing

Check page accessibility:

```typescript
const content = await extractor.extractContent();
const elementsWithoutLabels = content.interactiveElements.filter(
  el => !el.accessibility.name
);
console.log('Elements missing accessible names:', elementsWithoutLabels.length);
```

### Content Analysis

Analyze page structure:

```typescript
const content = await extractor.extractContent();
console.log('Heading hierarchy:');
content.headings.forEach(h => {
  const indent = '  '.repeat((h.accessibility.level || 1) - 1);
  console.log(`${indent}- ${h.text}`);
});
```

## Limitations

- **JSDOM Compatibility**: Full functionality requires a real browser; JSDOM has limited `getComputedStyle()` support
- **Cross-Origin Frames**: Cannot extract content from cross-origin iframes due to browser security
- **Shadow DOM Detection**: Shadow DOM presence detection relies on traversing all elements
- **Dynamic Content**: Does not automatically wait for dynamic content to load; call after page is ready
- **Large Pages**: Deep DOM trees may impact performance; use `maxDepth` to limit

## Future Enhancements

- CDP Accessibility Tree integration for better semantic extraction
- Screenshot integration with extracted element bounds
- XPath selector generation in addition to CSS selectors
- Caching for repeated extractions
- Stream-based extraction for large pages
- Custom visibility predicates
- Performance profiling and optimization

## References

- [Chrome DevTools Protocol - Accessibility Domain](https://chromerdevtools.github.io/devtools-protocol/tot/Accessibility/)
- [WAI-ARIA Specification](https://www.w3.org/TR/wai-aria/)
- [Playwright Accessibility Testing](https://playwright.dev/docs/accessibility-testing)
- [MDN - getComputedStyle](https://developer.mozilla.org/en-US/docs/Web/API/Window/getComputedStyle)
- [MDN - getBoundingClientRect](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect)
