#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types';
import { TheAgent, BrowserType } from '@theagent/core';
import * as dotenv from 'dotenv';
import { BrowserMCPTools } from './tools';

// Load environment variables
dotenv.config();

class TheAgentMCPServer {
  private server: Server;
  private theAgent: TheAgent | null = null;
  private tools: BrowserMCPTools;

  constructor() {
    this.tools = new BrowserMCPTools();
    
    // Initialize the MCP server
    this.server = new Server(
      {
        name: 'theagent-browser-automation',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // Handle tool listing
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.tools.getToolDefinitions(),
      };
    });

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
      const { name, arguments: args } = request.params;
      
      // Initialize browser if needed
      if (!this.theAgent && name !== 'browser_close') {
        await this.initializeBrowser();
      }

      // Execute the tool
      const result = await this.tools.executeTool(name, args || {}, this.theAgent!);
      
      // Close browser if requested
      if (name === 'browser_close' && this.theAgent) {
        await this.theAgent.close();
        this.theAgent = null;
      }

      return result;
    });
  }

  private async initializeBrowser(): Promise<void> {
    if (this.theAgent) {
      return;
    }

    const config = {
      adapter: process.env.BROWSER_TYPE || 'playwright',
      browserType: this.getBrowserType(process.env.BROWSER_TYPE || 'chromium'),
      headless: process.env.BROWSER_HEADLESS !== 'false',
      viewport: { 
        width: parseInt(process.env.VIEWPORT_WIDTH || '1280'),
        height: parseInt(process.env.VIEWPORT_HEIGHT || '720')
      },
      ai: {
        provider: process.env.DEFAULT_AI_PROVIDER || 'ollama',
        baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        model: process.env.OLLAMA_MODEL || 'llama3.2',
        temperature: parseFloat(process.env.OLLAMA_TEMPERATURE || '0.3'),
        timeout: parseInt(process.env.DEFAULT_TIMEOUT || '10000'),
      }
    };

    this.theAgent = new TheAgent(config);
    await this.theAgent.initialize();
  }

  private getBrowserType(browser: string): BrowserType {
    switch (browser.toLowerCase()) {
      case 'chrome':
      case 'chromium':
        return BrowserType.CHROMIUM;
      case 'firefox':
        return BrowserType.FIREFOX;
      case 'safari':
      case 'webkit':
        return BrowserType.WEBKIT;
      case 'edge':
        return BrowserType.CHROMIUM;
      default:
        return BrowserType.CHROMIUM;
    }
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      if (this.theAgent) {
        await this.theAgent.close();
      }
      process.exit(0);
    });
  }
}

// Start the server
if (require.main === module) {
  const server = new TheAgentMCPServer();
  server.start().catch((error) => {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  });
}

export { TheAgentMCPServer };
