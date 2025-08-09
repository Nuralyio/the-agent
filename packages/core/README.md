# @theagent/core

Core browser automation framework with multi-adapter support for Playwright,
Puppeteer, and Selenium. Provides AI-powered element detection and natural
language instruction parsing.

## Features

- 🎭 **Multi-Adapter Support**: Playwright, Puppeteer, and Selenium adapters
- 🌐 **Cross-Browser Compatibility**: Chrome, Firefox, Safari, Edge support
- 🤖 **AI Integration**: Ollama-powered natural language instruction parsing
- 🎯 **Smart Element Detection**: AI-powered element identification
- 📱 **Responsive Testing**: Multiple viewport and device simulation
- 🔍 **Intelligent Fallbacks**: Automatic adapter switching and error recovery
- 📊 **Performance Monitoring**: Built-in metrics and benchmarking
- 🛡️ **Type Safety**: Full TypeScript support with strict typing

## Installation

```bash
npm install @theagent/core
```

## Quick Start

```typescript
import { BrowserAutomation, BrowserType } from '@theagent/core';

const automation = new BrowserAutomation({
  adapter: 'playwright',
  headless: false,
  browserType: BrowserType.CHROME,
});

// Navigate and interact
await automation.navigate('https://example.com');
await automation.execute('Take a screenshot of the page');
await automation.close();
```

## API Reference

See the main project documentation for detailed API reference and examples.
