# @theagent/mcp-server

Model Context Protocol (MCP) server for the TheAgent browser automation framework. This package exposes browser automation capabilities as MCP tools that can be used by AI assistants and other MCP clients.

## 🚀 Features

- **Browser Navigation**: Navigate to websites and interact with pages
- **Element Interaction**: Click buttons, fill forms, select options
- **Content Extraction**: Extract text, take screenshots, get page information
- **AI-Powered Actions**: Natural language instruction processing
- **Multi-Browser Support**: Works with Playwright, Puppeteer, and Selenium
- **Real-time Feedback**: Streaming execution updates

## 📦 Installation

```bash
npm install @theagent/mcp-server
```

## 🔧 Usage

### As MCP Server

```bash
# Start the MCP server
npx theagent-mcp

# Or use with custom configuration
OLLAMA_BASE_URL=http://localhost:11434 npx theagent-mcp
```

### In MCP Client Configuration

Add to your MCP client configuration (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "theagent": {
      "command": "npx",
      "args": ["@theagent/mcp-server"]
    }
  }
}
```

## 🛠️ Available Tools

### `browser_navigate`
Navigate to a specific URL
- **url** (string): The URL to navigate to

### `browser_execute`
Execute a natural language browser automation task
- **instruction** (string): Natural language instruction
- **take_screenshot** (boolean, optional): Whether to take a screenshot after execution

### `browser_screenshot`
Take a screenshot of the current page
- **selector** (string, optional): CSS selector to screenshot specific element

### `browser_extract_text`
Extract text content from the page
- **selector** (string, optional): CSS selector to extract text from specific element

### `browser_get_page_info`
Get information about the current page (title, URL, etc.)

### `browser_close`
Close the browser session

## ⚙️ Configuration

The MCP server uses environment variables for configuration:

```bash
# AI Provider (for natural language processing)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
DEFAULT_AI_PROVIDER=ollama

# Browser Configuration
BROWSER_TYPE=playwright
BROWSER_HEADLESS=true
BROWSER_TIMEOUT=30000

# Debug
DEBUG=false
```

## 🏗️ Architecture

The MCP server acts as a bridge between MCP clients and the TheAgent core:

```
MCP Client (Claude, etc.)
      ↓
  MCP Protocol
      ↓
@theagent/mcp-server
      ↓
  @theagent/core
      ↓
Browser Adapters (Playwright, etc.)
```

## 🔗 Related Packages

- **[@theagent/core](../core)** - Core browser automation framework
- **[@theagent/cli](../cli)** - Command-line interface
- **[@theagent/api](../api)** - HTTP API server
- **[@theagent/web-ui](../web-ui)** - Web dashboard
