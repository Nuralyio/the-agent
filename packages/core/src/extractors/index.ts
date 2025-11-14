/**
 * Content extraction module
 * 
 * This module provides visibility and accessibility-aware content extraction
 * from web pages using browser automation.
 */

export * from './types';
export * from './extractor.interface';
export * from './base-extractor';
export * from './playwright-extractor';
export * from './puppeteer-extractor';
export { extractPageContent, extractVisibleText } from './extraction-script';
