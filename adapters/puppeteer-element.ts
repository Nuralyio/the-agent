import { ElementHandle } from '../types';
import type { ElementHandle as PuppeteerElementHandleType } from 'puppeteer';

/**
 * Puppeteer element handle implementation
 */
export class PuppeteerElementHandle implements ElementHandle {
  constructor(private element: PuppeteerElementHandleType) {}

  /**
   * Click the element
   */
  async click(): Promise<void> {
    await this.element.click();
  }

  /**
   * Type text into the element
   */
  async type(text: string): Promise<void> {
    await this.element.type(text);
  }

  /**
   * Get element text content
   */
  async getText(): Promise<string> {
    const text = await this.element.evaluate(el => el.textContent);
    return text || '';
  }

  /**
   * Get element attribute value
   */
  async getAttribute(name: string): Promise<string | null> {
    return await this.element.evaluate((el, attrName) => {
      return el.getAttribute(attrName);
    }, name);
  }

  /**
   * Check if element is visible
   */
  async isVisible(): Promise<boolean> {
    return await this.element.evaluate(el => {
      const style = window.getComputedStyle(el);
      return style && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    });
  }

  /**
   * Get element bounding box
   */
  async boundingBox(): Promise<{ x: number; y: number; width: number; height: number } | null> {
    return await this.element.boundingBox();
  }

  /**
   * Get the underlying Puppeteer element handle
   */
  getPuppeteerElement(): PuppeteerElementHandleType {
    return this.element;
  }

  /**
   * Check if element is enabled
   */
  async isEnabled(): Promise<boolean> {
    return await this.element.evaluate(el => !el.hasAttribute('disabled'));
  }

  /**
   * Get element inner HTML
   */
  async innerHTML(): Promise<string> {
    return await this.element.evaluate(el => el.innerHTML);
  }

  /**
   * Get element value (for form inputs)
   */
  async getValue(): Promise<string> {
    return await this.element.evaluate(el => {
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
        return el.value;
      }
      return '';
    });
  }

  /**
   * Hover over the element
   */
  async hover(): Promise<void> {
    await this.element.hover();
  }

  /**
   * Focus the element
   */
  async focus(): Promise<void> {
    await this.element.focus();
  }
}
