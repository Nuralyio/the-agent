/**
 * Playwright implementation of content extractor
 */

import type { Page } from 'playwright';
import { BaseContentExtractor } from './base-extractor';
import { GenericPageAdapter } from './adapter-factory';

/**
 * Playwright-based content extractor implementation
 * Uses generic adapter to eliminate code duplication
 */
export class PlaywrightContentExtractor extends BaseContentExtractor {
  constructor(playwrightPage: Page) {
    super(new GenericPageAdapter(playwrightPage));
  }
}
