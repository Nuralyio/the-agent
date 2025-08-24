import type { Locator } from 'playwright';
import { ElementHandle } from '../interfaces';

/**
 * Playwright element handle implementation
 */
export class PlaywrightElementHandle implements ElementHandle {
  constructor(private locator: Locator) { }

  /**
   * Click the element
   */
  async click(): Promise<void> {
    await this.locator.click();
  }

  /**
   * Type text into the element
   */
  async type(text: string): Promise<void> {
    await this.locator.fill(text);
  }

  /**
   * Get element text content
   */
  async getText(): Promise<string> {
    const text = await this.locator.textContent();
    return text || '';
  }

  /**
   * Get element attribute value
   */
  async getAttribute(name: string): Promise<string | null> {
    return await this.locator.getAttribute(name);
  }

  /**
   * Check if element is visible
   */
  async isVisible(): Promise<boolean> {
    return await this.locator.isVisible();
  }

  /**
   * Get element bounding box
   */
  async boundingBox(): Promise<{ x: number; y: number; width: number; height: number } | null> {
    return await this.locator.boundingBox();
  }

  /**
   * Get the underlying Playwright locator
   */
  getPlaywrightLocator(): Locator {
    return this.locator;
  }

  /**
   * Check if element is enabled
   */
  async isEnabled(): Promise<boolean> {
    return await this.locator.isEnabled();
  }

  /**
   * Check if element is checked (for checkboxes/radio buttons)
   */
  async isChecked(): Promise<boolean> {
    return await this.locator.isChecked();
  }

  /**
   * Get element inner HTML
   */
  async innerHTML(): Promise<string> {
    return await this.locator.innerHTML();
  }

  /**
   * Get element value (for form inputs)
   */
  async getValue(): Promise<string> {
    return await this.locator.inputValue();
  }

  /**
   * Hover over the element
   */
  async hover(): Promise<void> {
    await this.locator.hover();
  }

  /**
   * Focus the element
   */
  async focus(): Promise<void> {
    await this.locator.focus();
  }

  /**
   * Select option(s) in a select element
   */
  async selectOption(values: string | string[]): Promise<void> {
    await this.locator.selectOption(values);
  }

  /**
   * Scroll the element into view
   */
  async scroll(): Promise<void> {
    await this.locator.scrollIntoViewIfNeeded();
  }
}
