/**
 * Puppeteer implementation of content extractor
 */

import type { Page } from 'puppeteer';
import { BaseContentExtractor } from './base-extractor';
import { GenericPageAdapter } from './adapter-factory';

/**
 * Puppeteer-based content extractor implementation
 * Uses generic adapter to eliminate code duplication
 */
export class PuppeteerContentExtractor extends BaseContentExtractor {
  constructor(puppeteerPage: Page) {
    super(new GenericPageAdapter(puppeteerPage));
  }
}
