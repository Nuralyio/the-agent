/**
 * ActionExecutor - Manages execution of browser automation action steps
 *
 * This class handles the execution of individual action steps including navigation,
 * clicking, typing, filling forms, waiting, extracting content, scrolling, and screenshots.
 */

import { executionStream } from '../../streaming/execution-stream';
import { ActionStep, ActionType, BrowserManager, PageState } from '../../types';
import { loadEnvironmentConfig } from '../../environment';

/**
 * Handles the execution of individual action steps
 */
export class ActionExecutor {
  private envConfig = loadEnvironmentConfig();

  constructor(private browserManager: BrowserManager) { }

  /**
   * Execute a single action step
   */
  async executeStep(step: ActionStep): Promise<any> {
    switch (step.type) {
      case ActionType.NAVIGATE:
        return await this.executeNavigate(step);
      case ActionType.CLICK:
        return await this.executeClick(step);
      case ActionType.TYPE:
        return await this.executeType(step);
      case ActionType.FILL:
        return await this.executeFill(step);
      case ActionType.WAIT:
        return await this.executeWait(step);
      case ActionType.EXTRACT:
        return await this.executeExtract(step);
      case ActionType.SCROLL:
        return await this.executeScroll(step);
      case ActionType.SCREENSHOT:
        return await this.executeScreenshot(step);
      default:
        throw new Error(`Unsupported action type: ${step.type}`);
    }
  }

  private async executeNavigate(step: ActionStep): Promise<any> {
    let page = await this.browserManager.getCurrentPage();

    if (!page) {
      console.log('📄 No active page found, creating new page for navigation...');
      page = await this.browserManager.createPage();
    }

    let url = step.value;
    if (!url && step.target?.description) {
      const urlMatch = step.target.description.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        url = urlMatch[0];
      } else if (step.target.description.includes('.')) {
        url = `https://${step.target.description}`;
      }
    }

    if (!url) {
      throw new Error('No URL specified for navigation');
    }

    console.log(`🌐 Navigating to: ${url}`);
    await page.navigate(url);

    console.log('⏳ Waiting for page to load...');
    await page.waitForLoad();

    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const currentPage = await this.captureState();
      executionStream.streamPageChange(url, currentPage.title, currentPage.screenshot);
    } catch (error) {
      console.warn('⚠️ Failed to stream page change:', error);
    }

    return { success: true };
  }

  private async executeClick(step: ActionStep): Promise<any> {
    const page = await this.browserManager.getCurrentPage();
    if (!page) throw new Error('No active page');

    if (step.target?.selector) {
      await page.click(step.target.selector);
    } else if (step.target?.coordinates) {
      throw new Error('Coordinate-based clicking not implemented yet');
    } else {
      throw new Error('No target specified for click action');
    }

    return { success: true };
  }

  private async executeType(step: ActionStep): Promise<any> {
    const page = await this.browserManager.getCurrentPage();
    if (!page) throw new Error('No active page');

    if (step.target?.selector && step.value) {
      await page.type(step.target.selector, step.value);
    } else {
      throw new Error('No target or value specified for type action');
    }

    return { success: true };
  }

  private async executeFill(step: ActionStep): Promise<any> {
    const page = await this.browserManager.getCurrentPage();
    if (!page) throw new Error('No active page');

    if (!step.value) {
      throw new Error('No form data specified for fill action');
    }

    try {
      let formData: { [key: string]: string } = {};

      try {
        formData = JSON.parse(step.value);
      } catch {
        if (step.target?.selector) {
          formData[step.target.selector] = step.value;
        } else {
          throw new Error('No target selector specified for single value fill');
        }
      }

      console.log(`📝 Filling form with data:`, formData);
      for (const [selector, value] of Object.entries(formData)) {
        try {
          console.log(`📝 Filling field "${selector}" with value "${value}"`);
          await page.waitForSelector(selector);

          await page.click(selector);
          await page.evaluate(() => document.execCommand('selectAll'));
          await page.type(selector, value);

        } catch (fieldError) {
          console.warn(`⚠️ Failed to fill field "${selector}":`, fieldError);
        }
      }

      return { success: true, filledFields: Object.keys(formData) };
    } catch (error) {
      console.error('❌ Form fill failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        canContinue: true
      };
    }
  }

  private async executeWait(step: ActionStep): Promise<any> {
    if (step.condition && step.condition.timeout) {
      await new Promise(resolve => setTimeout(resolve, step.condition!.timeout!));
    } else if (step.value) {
      const timeout = parseInt(step.value.toString());
      await new Promise(resolve => setTimeout(resolve, timeout));
    } else {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return { success: true };
  }

  private async executeExtract(step: ActionStep): Promise<any> {
    const page = await this.browserManager.getCurrentPage();
    if (!page) throw new Error('No active page');

    if (step.target?.selector) {
      try {
        const element = await page.waitForSelector(step.target.selector, { timeout: 2000 });
        if (element) {
          const text = await element.getText();
          if (text?.trim()) {
            console.log(`✅ Extracted text using selector "${step.target.selector}": "${text.trim()}"`);
            return { success: true, data: text.trim() };
          }
        }
      } catch (error) {
        console.error(`⚠️ Primary selector failed, trying generic extraction...`, error);
      }
    }

    const contentSelectors = ['p', 'div', 'span'];

    for (const selector of contentSelectors) {
      try {
        const elements = await page.findElements(selector);
        for (const element of elements) {
          const text = await element.getText();
          if (text?.trim() && text.length > 5) {
            console.log(`✅ Found text content with selector "${selector}": "${text.trim()}"`);
            return { success: true, data: text.trim() };
          }
        }
      } catch (error) {
        console.error(`⚠️ Failed to extract text with selector "${selector}":`, error);
      }
    }

    try {
      const allText = await page.evaluate(() => document.body.innerText || '');
      if (allText?.trim()) {
        console.log(`✅ Extracted page content (${allText.length} chars)`);
        return { success: true, data: allText.trim() };
      }
    } catch (error) {
      console.error('Failed to extract page content:', error);
    }

    return { success: false, data: null, error: 'Could not extract any text content' };
  }

  private async executeScroll(step: ActionStep): Promise<any> {
    const page = await this.browserManager.getCurrentPage();
    if (!page) throw new Error('No active page');
    //@todo: Implement scroll by selector or coordinates
    await page.evaluate(() => {
       window.scrollBy( <number>(<unknown>step.value?.x) ?? 0, <number>(<unknown>step.value?.y) ?? 500);
    });

    return { success: true };
  }

  private async executeScreenshot(step: ActionStep): Promise<any> {
    const page = await this.browserManager.getCurrentPage();
    if (!page) throw new Error('No active page');

    const screenshot = await page.screenshot();

    if (step.value) {
      const fs = require('fs');
      const path = require('path');

      const executionLogsDir = path.join(process.cwd(), this.envConfig.execution.logsDir);
      const screenshotPath = path.join(executionLogsDir, step.value);

      if (!fs.existsSync(executionLogsDir)) {
        fs.mkdirSync(executionLogsDir, { recursive: true });
      }

      fs.writeFileSync(screenshotPath, screenshot);
      console.log(`📸 Screenshot saved to: ${screenshotPath}`);
    }

    return {
      success: true,
      screenshot,
      path: step.value || 'screenshot-buffer'
    };
  }

  /**
   * Capture current page state for context
   */
  async captureState(): Promise<PageState> {
    const page = await this.browserManager.getCurrentPage();
    if (!page) {
      throw new Error('No active page');
    }

    try {
      console.log('⏳ Ensuring page is fully loaded before capturing state...');
      await page.waitForLoad();
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log('✅ Page load complete, capturing state...');
    } catch (error) {
      console.warn('⚠️ Page load state check failed, proceeding with current state:', error);
    }

    const [screenshot, content, url] = await Promise.all([
      page.screenshot(),
      page.content(),
      page.evaluate(() => window.location.href)
    ]);

    return {
      url,
      title: await page.evaluate(() => document.title),
      content,
      screenshot,
      timestamp: Date.now(),
      viewport: { width: 1280, height: 720 },
      elements: []
    };
  }
}
