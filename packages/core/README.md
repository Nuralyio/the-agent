# @theagent/core

🚀 **AI-Powered Browser Automation Core Framework**

The heart of TheAgent - a sophisticated browser automation framework that combines multiple browser adapters with AI-powered natural language processing. Built for scalability, reliability, and intelligent automation.

## ✨ Features

### 🎭 **Multi-Adapter Architecture**
- **Playwright** - Fast, reliable, modern browser automation
- **Puppeteer** - Chrome/Chromium focused with rich debugging
- **Selenium** - Industry standard with broad compatibility
- **Automatic Fallbacks** - Seamless adapter switching on failures

### 🤖 **AI Integration**
- **Multiple AI Providers**: OpenAI, Ollama, Anthropic, Mistral
- **Natural Language Processing** - Convert instructions to browser actions
- **Vision Capabilities** - Screenshot analysis and visual element detection
- **Structured Output** - JSON schema validation for reliable responses
- **Smart Planning** - AI-powered execution planning and adaptation
- **LLM Observability** - OpenTelemetry and Langfuse integration for monitoring

### 🌐 **Cross-Platform Browser Support**
- **Chrome/Chromium** - Full feature support
- **Firefox** - Cross-engine compatibility
- **Safari** - macOS native support
- **Edge** - Microsoft ecosystem integration

### 🎯 **Advanced Automation Features**
- **Smart Element Detection** - AI-powered selector generation
- **Intelligent Retry Logic** - Automatic error recovery
- **Real-time Streaming** - Live execution monitoring
- **Screenshot Management** - Automated visual documentation
- **Performance Monitoring** - Built-in metrics and benchmarking

### 🛡️ **Enterprise Ready**
- **TypeScript First** - Full type safety and IntelliSense
- **Extensive Testing** - Unit and integration test coverage
- **Modular Architecture** - Clean separation of concerns
- **Production Logging** - Comprehensive debug and audit trails

## 📦 Installation

```bash
npm install @theagent/core
```

## 🚀 Quick Start

### Basic Usage

```typescript
import { TheAgent, BrowserType } from '@theagent/core';

// Initialize with default configuration
const agent = new TheAgent({
  adapter: 'playwright',
  headless: false,
  browserType: BrowserType.CHROME,
});

// Navigate and perform actions
await agent.navigate('https://example.com');
await agent.execute('Click the login button');
await agent.execute('Fill username field with "user@example.com"');
await agent.execute('Take a screenshot');
await agent.close();
```

### Advanced Configuration

```typescript
import { TheAgent, AIConfig, BrowserConfig } from '@theagent/core';

// AI Configuration
const aiConfig: AIConfig = {
  provider: 'openai',
  model: 'gpt-4o',
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0.3,
  maxTokens: 2000
};

// Browser Configuration
const browserConfig: BrowserConfig = {
  adapter: 'playwright',
  headless: false,
  browserType: 'chrome',
  viewport: { width: 1920, height: 1080 },
  timeout: 30000
};

const agent = new TheAgent(browserConfig, aiConfig);
```

### Streaming Execution

```typescript
import { TheAgent, executionStream } from '@theagent/core';

const agent = new TheAgent({ adapter: 'playwright' });

// Listen to real-time execution events
executionStream.on('step:start', (data) => {
  console.log('Starting step:', data.step.description);
});

executionStream.on('step:complete', (data) => {
  console.log('Completed step:', data.step.description);
});

// Execute with streaming
await agent.execute('Navigate to https://example.com and take a screenshot');
```

## 🏗️ Architecture

### Core Components

```
@theagent/core/
├── adapters/           # Browser adapter implementations
│   ├── playwright/     # Playwright adapter
│   ├── puppeteer/      # Puppeteer adapter
│   └── adapter-registry.ts
├── engine/             # Core automation engine
│   ├── action-engine.ts    # Action execution
│   ├── ai-engine.ts        # AI integration
│   └── planning/           # Task planning
├── providers/          # AI provider implementations
│   ├── openai/         # OpenAI/GPT integration
│   ├── ollama/         # Local Ollama integration
│   ├── anthropic/      # Claude integration
│   └── shared/         # Common utilities
├── streaming/          # Real-time execution monitoring
├── managers/           # Resource management
└── types/              # TypeScript definitions
```

### AI Providers

#### OpenAI Integration
```typescript
import { OpenAIProvider } from '@theagent/core';

const provider = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o',
  temperature: 0.3,
  maxTokens: 2000
});
```

#### Ollama (Local AI)
```typescript
import { OllamaProvider } from '@theagent/core';

const provider = new OllamaProvider({
  baseUrl: 'http://localhost:11434',
  model: 'llama3.2',
  temperature: 0.3
});
```

#### Anthropic Claude
```typescript
import { AnthropicProvider } from '@theagent/core';

const provider = new AnthropicProvider({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-3-sonnet-20240229',
  temperature: 0.5
});
```

## 🔧 Configuration

### Environment Variables

```bash
# AI Provider Configuration
DEFAULT_AI_PROVIDER=openai
OPENAI_API_KEY=your-openai-key
OLLAMA_BASE_URL=http://localhost:11434
ANTHROPIC_API_KEY=your-anthropic-key

# Browser Configuration
DEFAULT_ADAPTER=playwright
DEFAULT_BROWSER=chrome
HEADLESS=false

# Debugging
DEBUG=false
LOG_LEVEL=info
SCREENSHOT_ON_ERROR=true
```

### Prompt Templates

The core package includes optimized prompt templates for various automation tasks:

- `instruction-to-steps.txt` - Convert natural language to action steps
- `page-analysis.txt` - Analyze page content and structure
- `step-refinement.txt` - Refine and optimize execution steps
- `context-aware-refinement.txt` - Context-aware plan adaptation

## 🧪 Testing

```bash
# Run all tests
npm run test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## 📊 Performance & Monitoring

### Execution Metrics
```typescript
import { TheAgent, executionStream } from '@theagent/core';

executionStream.on('metrics', (data) => {
  console.log('Execution time:', data.duration);
  console.log('Steps completed:', data.stepsCompleted);
  console.log('Success rate:', data.successRate);
});
```

### Debug Logging
```typescript
// Enable debug logging
process.env.DEBUG = 'true';
process.env.LOG_LEVEL = 'debug';

const agent = new TheAgent({
  adapter: 'playwright',
  // Debug logs will be saved to ai-debug-logs/
});
```

## 🔌 API Reference

### TheAgent Class

#### Constructor
```typescript
new TheAgent(browserConfig: BrowserConfig, aiConfig?: AIConfig)
```

#### Methods
- `navigate(url: string): Promise<void>` - Navigate to URL
- `execute(instruction: string): Promise<TaskResult>` - Execute natural language instruction
- `takeScreenshot(options?: ScreenshotOptions): Promise<Buffer>` - Capture screenshot
- `close(): Promise<void>` - Close browser and cleanup

### ActionEngine Class

#### Methods
- `executeStep(step: ActionStep): Promise<void>` - Execute single action step
- `executeSequence(steps: ActionStep[]): Promise<void>` - Execute action sequence

### AIEngine Class

#### Methods
- `planInstruction(instruction: string): Promise<ActionPlan>` - Generate execution plan
- `adaptPlan(plan: ActionPlan, context: TaskContext): Promise<ActionPlan>` - Adapt plan to context

## 🤝 Contributing

See the main project [CONTRIBUTING.md](../../CONTRIBUTING.md) for contribution guidelines.

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.

## 🔗 Related Packages

- [`@theagent/cli`](../cli) - Command-line interface
- [`@theagent/web-ui`](../web-ui) - Web-based user interface
- [`@theagent/api`](../api) - REST API server

## 📖 Documentation

For comprehensive documentation, examples, and tutorials, visit:

- [Main Project Documentation](../../docs/)
- [LLM Observability Guide](./docs/OBSERVABILITY.md) - OpenTelemetry and Langfuse integration

---

**TheAgent Core** - Intelligent browser automation for the modern web. 🚀
