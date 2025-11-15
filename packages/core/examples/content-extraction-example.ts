/**
 * Content Extraction Example
 * 
 * This example demonstrates how to use the visibility and accessibility-aware
 * content extractor to extract meaningful content from web pages.
 */

import { TheAgent } from '../src/the-agent';
import { ExtractionOptions } from '../src/extractors';

async function basicExtractionExample() {
  console.log('=== Basic Content Extraction Example ===\n');

  // Initialize the agent with Playwright adapter
  const agent = new TheAgent({
    adapter: 'playwright',
    browserType: 'chromium',
    headless: true,
  });

  try {
    await agent.initialize();

    // Navigate to a page
    const page = await agent.browserManager.createPage('https://example.com');

    // Get the content extractor
    const extractor = page.getContentExtractor();

    // Extract all visible content
    const content = await extractor.extractContent();

    console.log('Page Title:', content.title);
    console.log('Page URL:', content.url);
    console.log('Total Elements:', content.metadata.totalElements);
    console.log('Visible Elements:', content.metadata.visibleElements);
    console.log('Interactive Elements:', content.metadata.interactiveElements);
    console.log('\nHeadings:');
    content.headings.forEach((heading) => {
      console.log(`  - ${heading.tagName.toUpperCase()}: ${heading.text}`);
    });

    console.log('\nLinks:');
    content.links.slice(0, 5).forEach((link) => {
      console.log(`  - ${link.text} (${link.attributes.href})`);
    });

    console.log('\nInteractive Elements:');
    content.interactiveElements.slice(0, 5).forEach((element) => {
      console.log(`  - ${element.tagName}: ${element.accessibility.name || element.text}`);
    });

  } finally {
    await agent.browserManager.closeBrowser();
  }
}

async function advancedExtractionExample() {
  console.log('\n=== Advanced Content Extraction Example ===\n');

  const agent = new TheAgent({
    adapter: 'playwright',
    browserType: 'chromium',
    headless: true,
  });

  try {
    await agent.initialize();
    const page = await agent.browserManager.createPage('https://example.com');
    const extractor = page.getContentExtractor();

    // Extract with custom options
    const options: ExtractionOptions = {
      includeHidden: false,        // Only visible elements
      maxDepth: 5,                 // Limit traversal depth
      includeShadowDOM: true,      // Include shadow DOM content
      includeFrames: true,         // Include iframe content
      filterByRole: ['button', 'link', 'textbox'], // Only specific roles
      excludeSelectors: ['.ad', '.cookie-banner'], // Exclude ads and banners
    };

    const result = await extractor.extractAllFrames(options);

    console.log('Main Frame:');
    console.log('  - Total elements:', result.mainFrame.metadata.totalElements);
    console.log('  - Visible elements:', result.mainFrame.metadata.visibleElements);
    console.log('  - Has frames:', result.mainFrame.metadata.hasFrames);
    console.log('  - Has shadow DOM:', result.mainFrame.metadata.hasShadowDOM);

    console.log('\nIframes found:', result.frames.length);
    result.frames.forEach((frame, index) => {
      console.log(`\nFrame ${index + 1}:`);
      console.log(`  - Name: ${frame.frameName}`);
      console.log(`  - URL: ${frame.frameUrl}`);
      console.log(`  - Elements: ${frame.content.metadata.totalElements}`);
    });

    console.log('\nExtraction time:', result.extractionTime, 'ms');

  } finally {
    await agent.browserManager.closeBrowser();
  }
}

async function visibilityCheckExample() {
  console.log('\n=== Visibility Check Example ===\n');

  const agent = new TheAgent({
    adapter: 'playwright',
    browserType: 'chromium',
    headless: true,
  });

  try {
    await agent.initialize();
    const page = await agent.browserManager.createPage('https://example.com');
    const extractor = page.getContentExtractor();

    // Check visibility of specific elements
    const buttonSelector = 'button';
    const visibility = await extractor.checkVisibility(buttonSelector);

    console.log('Button Visibility State:');
    console.log('  - Is visible:', visibility.isVisible);
    console.log('  - Is in viewport:', visibility.isInViewport);
    console.log('  - Has size:', visibility.hasSize);
    console.log('  - Is interactive:', visibility.isInteractive);
    console.log('  - Display style:', visibility.displayStyle);
    console.log('  - Visibility style:', visibility.visibilityStyle);
    console.log('  - Opacity:', visibility.opacity);
    console.log('  - Bounds:', visibility.bounds);

  } catch (error) {
    console.error('Error checking visibility:', error);
  } finally {
    await agent.browserManager.closeBrowser();
  }
}

async function accessibilityInfoExample() {
  console.log('\n=== Accessibility Information Example ===\n');

  const agent = new TheAgent({
    adapter: 'playwright',
    browserType: 'chromium',
    headless: true,
  });

  try {
    await agent.initialize();
    const page = await agent.browserManager.createPage('https://example.com');
    const extractor = page.getContentExtractor();

    // Get accessibility information
    const linkSelector = 'a';
    const a11yInfo = await extractor.getAccessibilityInfo(linkSelector);

    console.log('Link Accessibility Information:');
    console.log('  - Role:', a11yInfo.role);
    console.log('  - Name:', a11yInfo.name);
    console.log('  - Description:', a11yInfo.description);
    console.log('  - Disabled:', a11yInfo.disabled);
    console.log('  - Focused:', a11yInfo.focused);
    console.log('  - Required:', a11yInfo.required);

  } catch (error) {
    console.error('Error getting accessibility info:', error);
  } finally {
    await agent.browserManager.closeBrowser();
  }
}

async function visibleTextExample() {
  console.log('\n=== Visible Text Extraction Example ===\n');

  const agent = new TheAgent({
    adapter: 'playwright',
    browserType: 'chromium',
    headless: true,
  });

  try {
    await agent.initialize();
    const page = await agent.browserManager.createPage('https://example.com');
    const extractor = page.getContentExtractor();

    // Extract only visible text nodes
    const textNodes = await extractor.extractVisibleText();

    console.log('Visible Text Nodes:');
    textNodes.slice(0, 10).forEach((text, index) => {
      console.log(`  ${index + 1}. ${text}`);
    });

    console.log(`\nTotal visible text nodes: ${textNodes.length}`);

  } finally {
    await agent.browserManager.closeBrowser();
  }
}

async function interactiveElementsExample() {
  console.log('\n=== Interactive Elements Example ===\n');

  const agent = new TheAgent({
    adapter: 'playwright',
    browserType: 'chromium',
    headless: true,
  });

  try {
    await agent.initialize();
    const page = await agent.browserManager.createPage('https://example.com');
    const extractor = page.getContentExtractor();

    // Extract only interactive elements
    const interactiveElements = await extractor.extractInteractiveElements();

    console.log('Interactive Elements Found:', interactiveElements.length);
    interactiveElements.slice(0, 10).forEach((element, index) => {
      console.log(`\n${index + 1}. ${element.tagName.toUpperCase()}`);
      console.log(`   Text: ${element.text.substring(0, 50)}`);
      console.log(`   Role: ${element.accessibility.role}`);
      console.log(`   Selector: ${element.selector}`);
      if (element.attributes.href) {
        console.log(`   Link: ${element.attributes.href}`);
      }
      if (element.attributes.type) {
        console.log(`   Type: ${element.attributes.type}`);
      }
    });

  } finally {
    await agent.browserManager.closeBrowser();
  }
}

// Run all examples
async function runAllExamples() {
  try {
    await basicExtractionExample();
    await advancedExtractionExample();
    await visibilityCheckExample();
    await accessibilityInfoExample();
    await visibleTextExample();
    await interactiveElementsExample();

    console.log('\n=== All Examples Completed Successfully ===\n');
  } catch (error) {
    console.error('Error running examples:', error);
    process.exit(1);
  }
}

// Uncomment to run the examples
// runAllExamples();

export {
  basicExtractionExample,
  advancedExtractionExample,
  visibilityCheckExample,
  accessibilityInfoExample,
  visibleTextExample,
  interactiveElementsExample,
};
