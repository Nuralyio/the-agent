import { BrowserAutomation } from '@theagent/core';
import { Tool } from '@modelcontextprotocol/sdk/types';

export class BrowserMCPTools {
  
  getToolDefinitions(): Tool[] {
    return [
      {
        name: 'browser_navigate',
        description: 'Navigate to a specific URL in the browser',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'The URL to navigate to',
            },
          },
          required: ['url'],
        },
      },
      {
        name: 'browser_execute',
        description: 'Execute a natural language browser automation task',
        inputSchema: {
          type: 'object',
          properties: {
            instruction: {
              type: 'string',
              description: 'Natural language instruction for browser automation',
            },
            take_screenshot: {
              type: 'boolean',
              description: 'Whether to take a screenshot after execution',
              default: false,
            },
          },
          required: ['instruction'],
        },
      },
      {
        name: 'browser_screenshot',
        description: 'Take a screenshot of the current page or specific element',
        inputSchema: {
          type: 'object',
          properties: {
            selector: {
              type: 'string',
              description: 'CSS selector to screenshot specific element (optional)',
            },
            path: {
              type: 'string',
              description: 'File path to save screenshot (optional)',
            },
          },
        },
      },
      {
        name: 'browser_extract_text',
        description: 'Extract text content from the current page or specific element',
        inputSchema: {
          type: 'object',
          properties: {
            selector: {
              type: 'string',
              description: 'CSS selector to extract text from specific element (optional)',
            },
          },
        },
      },
      {
        name: 'browser_get_page_info',
        description: 'Get information about the current page (title, URL, etc.)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'browser_click',
        description: 'Click on an element specified by selector or text',
        inputSchema: {
          type: 'object',
          properties: {
            selector: {
              type: 'string',
              description: 'CSS selector or text to click on',
            },
          },
          required: ['selector'],
        },
      },
      {
        name: 'browser_type',
        description: 'Type text into an input field',
        inputSchema: {
          type: 'object',
          properties: {
            selector: {
              type: 'string',
              description: 'CSS selector of the input field',
            },
            text: {
              type: 'string',
              description: 'Text to type',
            },
          },
          required: ['selector', 'text'],
        },
      },
      {
        name: 'browser_wait',
        description: 'Wait for an element to appear or a condition to be met',
        inputSchema: {
          type: 'object',
          properties: {
            selector: {
              type: 'string',
              description: 'CSS selector to wait for',
            },
            timeout: {
              type: 'number',
              description: 'Timeout in milliseconds (default: 30000)',
              default: 30000,
            },
          },
          required: ['selector'],
        },
      },
      {
        name: 'browser_close',
        description: 'Close the browser session',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ];
  }

  async executeTool(name: string, args: any, automation: BrowserAutomation): Promise<any> {
    switch (name) {
      case 'browser_navigate':
        return await this.navigate(automation, args.url);
      
      case 'browser_execute':
        return await this.execute(automation, args.instruction, args.take_screenshot);
      
      case 'browser_screenshot':
        return await this.screenshot(automation, args.selector, args.path);
      
      case 'browser_extract_text':
        return await this.extractText(automation, args.selector);
      
      case 'browser_get_page_info':
        return await this.getPageInfo(automation);
      
      case 'browser_click':
        return await this.click(automation, args.selector);
      
      case 'browser_type':
        return await this.type(automation, args.selector, args.text);
      
      case 'browser_wait':
        return await this.wait(automation, args.selector, args.timeout);
      
      case 'browser_close':
        return await this.close(automation);
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  private async navigate(automation: BrowserAutomation, url: string) {
    await automation.navigate(url);
    return {
      content: [
        {
          type: 'text',
          text: `Successfully navigated to ${url}`,
        },
      ],
    };
  }

  private async execute(automation: BrowserAutomation, instruction: string, takeScreenshot = false) {
    const result = await automation.execute(instruction);
    
    const content: any[] = [
      {
        type: 'text',
        text: `Executed instruction: "${instruction}"\nResult: ${JSON.stringify(result, null, 2)}`,
      },
    ];

    if (takeScreenshot) {
      const screenshotPath = `/tmp/screenshot-${Date.now()}.png`;
      await automation.screenshot(screenshotPath);
      content.push({
        type: 'image',
        data: screenshotPath,
        mimeType: 'image/png',
      });
    }

    return { content };
  }

  private async screenshot(automation: BrowserAutomation, selector?: string, path?: string) {
    const screenshotPath = path || `/tmp/screenshot-${Date.now()}.png`;
    
    if (selector) {
      // Take screenshot of specific element
      // Note: This might need to be implemented in the core package
      await automation.screenshot(screenshotPath);
    } else {
      await automation.screenshot(screenshotPath);
    }

    return {
      content: [
        {
          type: 'image',
          data: screenshotPath,
          mimeType: 'image/png',
        },
        {
          type: 'text',
          text: `Screenshot saved to ${screenshotPath}`,
        },
      ],
    };
  }

  private async extractText(automation: BrowserAutomation, selector?: string) {
    // This functionality would need to be added to the core package
    // For now, we'll use a workaround
    const result = await automation.execute(
      selector 
        ? `Extract text content from element with selector: ${selector}`
        : 'Extract all text content from the page'
    );

    return {
      content: [
        {
          type: 'text',
          text: `Extracted text: ${JSON.stringify(result, null, 2)}`,
        },
      ],
    };
  }

  private async getPageInfo(automation: BrowserAutomation) {
    // This would need to be implemented in the core package
    const result = await automation.execute('Get the current page title and URL');

    return {
      content: [
        {
          type: 'text',
          text: `Page information: ${JSON.stringify(result, null, 2)}`,
        },
      ],
    };
  }

  private async click(automation: BrowserAutomation, selector: string) {
    await automation.click(selector);
    return {
      content: [
        {
          type: 'text',
          text: `Successfully clicked on: ${selector}`,
        },
      ],
    };
  }

  private async type(automation: BrowserAutomation, selector: string, text: string) {
    await automation.type(selector, text);
    return {
      content: [
        {
          type: 'text',
          text: `Successfully typed "${text}" into: ${selector}`,
        },
      ],
    };
  }

  private async wait(automation: BrowserAutomation, selector: string, timeout = 30000) {
    // This would need to be implemented in the core package
    await automation.execute(`Wait for element with selector: ${selector}`, { timeout });
    return {
      content: [
        {
          type: 'text',
          text: `Successfully waited for element: ${selector}`,
        },
      ],
    };
  }

  private async close(automation: BrowserAutomation) {
    await automation.close();
    return {
      content: [
        {
          type: 'text',
          text: 'Browser session closed successfully',
        },
      ],
    };
  }
}
