# The agent - AI-Powered Browser Automation Framework

[![CI Tests](https://github.com/Nuralyio/the-agent/actions/workflows/ci.yml/badge.svg)](https://github.com/Nuralyio/the-agent/actions/workflows/ci.yml)
[![Test Coverage](https://github.com/Nuralyio/the-agent/actions/workflows/test-coverage.yml/badge.svg)](https://github.com/Nuralyio/the-agent/actions/workflows/test-coverage.yml)
[![PR Validation](https://github.com/Nuralyio/the-agent/actions/workflows/pr-validation.yml/badge.svg)](https://github.com/Nuralyio/the-agent/actions/workflows/pr-validation.yml)
[![Release](https://github.com/Nuralyio/the-agent/actions/workflows/release.yml/badge.svg)](https://github.com/Nuralyio/the-agent/actions/workflows/release.yml)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)](./CONTRIBUTING.md)

## 🚧 Project Status

**The Agent is in active development (Alpha)**

A comprehensive, AI-powered browser automation framework that understands
natural language instructions and executes web automation tasks intelligently.
the agent provides multi-adapter support for different browser engines with
real-time visualization and monitoring capabilities.

## ✨ Key Features

- 🤖 **AI-Powered Automation**: Natural language instruction processing using
  multiple AI providers (Ollama, OpenAI, Mistral)
- 🌐 **Multi-Browser Support**: Works with Playwright, Puppeteer, and Selenium
  adapters
- 🎯 **Intelligent Element Detection**: AI-driven element identification and
  interaction
- 📊 **Real-Time Dashboard**: Modern React-based web UI for monitoring and
  control
- 🔄 **WebSocket Integration**: Live automation streaming and status updates
- 🛠️ **CLI Interface**: Command-line tools for scripting and automation
- 🧪 **Unit Testing**: Comprehensive unit test coverage with CI/CD integration
- 📦 **Monorepo Architecture**: Well-organized, modular codebase

## 🏗️ Architecture

This project is organized as a TypeScript monorepo with the following packages:

### 📦 Core Packages

- **`@theagent/core`** - Core automation framework with multi-adapter support
  and AI integration
- **`@theagent/api`** - HTTP API server with WebSocket support for real-time
  communication
- **`@theagent/web-ui`** - Modern Remix-based dashboard for monitoring and
  control
- **`@theagent/cli`** - Command-line interface for automation scripting
- **`@theagent/mcp-server`** - Model Context Protocol server for AI assistant
  integration

### 🔧 Development Tools

- **`tools/test-server/`** - Local test server for automation testing
  (port 3005)
- **`tools/scripts/`** - Development and build scripts
- **`tools/config/`** - Shared configuration files

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** (recommended: use latest LTS)
- **npm** or **yarn** package manager
- **Git** for version control

### Installation

```bash
# Clone the repository
git clone https://github.com/Nuralyio/the-agent.git
cd the-agent

# Install dependencies for all packages
npm install

# Install browser dependencies (Playwright browsers)
npm run install:browsers
```

### Configuration

1. Copy the environment configuration file:

```bash
cp .env.example .env
```

2. Configure your AI provider in `.env`:

```bash
# For local Ollama (recommended)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2
OLLAMA_TEMPERATURE=0.3

# Or use OpenAI
OPENAI_API_KEY=your-api-key-here
OPENAI_MODEL=gpt-3.5-turbo
```

### Development

```bash
# Start all services simultaneously
npm run dev

# Or start individual services
npm run dev:core    # Core package development
npm run dev:api     # API server only (port 3002)
npm run dev:ui      # Web UI only (port 3003)
npm run dev:cli     # CLI development
```

### Access Points

- **API Server**: http://localhost:3002
- **Web Dashboard**: http://localhost:3003
- **Test Server**: http://localhost:3005

## 🛠️ Usage Examples

### Basic Automation

```typescript
import { BrowserAutomation } from '@theagent/core';

const automation = new BrowserAutomation({
  adapter: 'playwright',
  browserType: 'chromium',
  headless: false,
  ai: {
    provider: 'ollama',
    model: 'llama3.2',
  },
});

await automation.initialize();
const result = await automation.executeTask(
  "Navigate to google.com and search for 'TypeScript automation'",
);
```

### CLI Usage

```bash
# Install CLI globally
npm install -g @theagent/cli

# Run automation from command line
theagent execute "Take a screenshot of github.com"
theagent navigate "https://example.com" --adapter playwright
```

### API Integration

```bash
# Start automation task via REST API
curl -X POST http://localhost:3002/api/execute \
  -H "Content-Type: application/json" \
  -d '{"instruction": "Click the login button", "url": "https://example.com"}'
```

## 🧪 Testing

### Running Tests

```bash
# Run unit tests (recommended for CI/CD)
npm run test:unit

# Run all tests (unit + integration locally)
npm test

# Run integration tests (local development only)
npm run test:integration

# Test specific package
npm run test -w packages/core

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Structure

- **Unit Tests**: Located in `src/**/*.test.ts` files
- **Integration Tests**: Located in `src/tests/integration/` (local development
  only)
- **Test Environment**: Node.js with Jest and ts-jest
- **CI/CD**: Only unit tests run in GitHub Actions for reliability

## 🔨 Building

```bash
# Build all packages
npm run build

# Build specific package
npm run build -w packages/core
npm run build -w packages/api

# Clean build artifacts
npm run clean
```

## 📚 Documentation

### Core Documentation

| File                                   | Purpose                                         | Audience     |
| -------------------------------------- | ----------------------------------------------- | ------------ |
| [`README.md`](./README.md)             | Main project overview and setup guide           | All users    |
| [`CONTRIBUTING.md`](./CONTRIBUTING.md) | Development guidelines and contribution process | Contributors |
| [`CHANGELOG.md`](./CHANGELOG.md)       | Version history and release notes               | All users    |
| [`LICENSE`](./LICENSE)                 | MIT license terms                               | All users    |

### Framework Documentation

| File                                             | Purpose                                        | Audience     |
| ------------------------------------------------ | ---------------------------------------------- | ------------ |
| [`.github/WORKFLOWS.md`](./.github/WORKFLOWS.md) | CI/CD workflows and testing strategy           | Contributors |
| [`mainprompt.md`](./mainprompt.md)               | Project architecture and design specifications | Developers   |

### Package Documentation

| Package        | README                                                             | Purpose                                   |
| -------------- | ------------------------------------------------------------------ | ----------------------------------------- |
| **Core**       | [`packages/core/README.md`](./packages/core/README.md)             | Browser automation framework API          |
| **API Server** | [`packages/api/README.md`](./packages/api/README.md)               | HTTP server and WebSocket documentation   |
| **Web UI**     | [`packages/web-ui/README.md`](./packages/web-ui/README.md)         | Dashboard setup and customization         |
| **CLI**        | [`packages/cli/README.md`](./packages/cli/README.md)               | Command-line interface usage              |
| **MCP Server** | [`packages/mcp-server/README.md`](./packages/mcp-server/README.md) | Model Context Protocol server integration |

### Development Tools Documentation

| Tool            | README                                                         | Purpose                           |
| --------------- | -------------------------------------------------------------- | --------------------------------- |
| **Test Server** | [`tools/test-server/README.md`](./tools/test-server/README.md) | Local test server for development |

### Quick Documentation Guide

#### 📖 **Getting Started**

- Start with the main [README.md](./README.md) for setup and basic usage
- Check [CONTRIBUTING.md](./CONTRIBUTING.md) if you want to contribute
- Review package-specific READMEs for detailed API documentation

#### 🔧 **Development**

- [Core Package](./packages/core/README.md) - Main automation framework
- [API Server](./packages/api/README.md) - REST API and WebSocket server
- [Web UI](./packages/web-ui/README.md) - React dashboard interface
- [CLI Tool](./packages/cli/README.md) - Command-line interface
- [MCP Server](./packages/mcp-server/README.md) - Model Context Protocol
  integration

#### 🛠️ **Tools & Utilities**

- [Test Server](./tools/test-server/README.md) - Development testing environment
- [GitHub Workflows](./.github/WORKFLOWS.md) - CI/CD configuration and testing
  strategy

#### 📋 **Project Management**

- [CHANGELOG.md](./CHANGELOG.md) - Version history and release notes
- [mainprompt.md](./mainprompt.md) - Project specifications and architecture

## 📁 Project Structure

```
├── .github/
│   └── WORKFLOWS.md    # CI/CD documentation
├── packages/
│   ├── core/           # Core automation framework
│   │   └── README.md   # Core API documentation
│   ├── api/            # HTTP API server
│   │   └── README.md   # API server documentation
│   ├── web-ui/         # React dashboard
│   │   └── README.md   # Web UI setup guide
│   ├── cli/            # Command-line interface
│   │   └── README.md   # CLI usage guide
│   └── mcp-server/     # Model Context Protocol server
│       └── README.md   # MCP server documentation
├── tools/
│   ├── test-server/    # Development test server
│   │   └── README.md   # Test server documentation
│   ├── scripts/        # Build and dev scripts
│   └── config/         # Shared configurations
├── logs/               # Execution logs
├── mainprompt.md       # Project specifications
├── CONTRIBUTING.md     # Contribution guidelines
├── CHANGELOG.md        # Release history
├── LICENSE             # MIT license
└── README.md           # This file
```

## ⚙️ Configuration

### Environment Variables

Key configuration options available in `.env`:

```bash
# AI Provider Settings
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2
OPENAI_API_KEY=your-key
MISTRAL_API_KEY=your-key

# Server Ports
PORT=3002                    # API server port
TEST_SERVER_PORT=3005        # Test server port

# Browser Settings
DEFAULT_BROWSER=chromium
HEADLESS=true
VIEWPORT_WIDTH=1280
VIEWPORT_HEIGHT=720
```

### Browser Adapters

Supported browser automation adapters:

- **Playwright** (recommended): Modern, fast, reliable
- **Puppeteer**: Chrome/Chromium focused
- **Selenium**: Legacy support, broad compatibility

## Code Quality

### Linting and Formatting

```bash
# Lint all packages
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check

# Type checking
npm run typecheck
```

### Pre-commit Hooks

Husky is configured to run:

- ESLint with auto-fix
- Prettier formatting
- TypeScript type checking
- Test suite

## 🚀 Production Deployment

### Building for Production

```bash
# Clean and build all packages
npm run clean
npm run build

# Start production API server
cd packages/api && npm start

# Build and serve web UI
cd packages/web-ui && npm run build && npm start
```

### Docker Support

```bash
# Build Docker image (if Dockerfile exists)
docker build -t the agent .

# Run with Docker Compose (if docker-compose.yml exists)
docker-compose up -d
```

## 🤝 Contributing

We welcome contributions! Please read our
[Contributing Guide](./CONTRIBUTING.md) for details on:

- 🚀 **Quick Start**: Setting up your development environment
- 📋 **Development Guidelines**: Code standards and testing requirements
- 🔧 **Development Workflow**: Step-by-step contribution process
- 📝 **Pull Request Process**: How to submit changes
- 🐛 **Bug Reports**: How to report issues effectively
- 💡 **Feature Requests**: How to suggest new features

### Quick Contributing Steps

1. **Fork & Clone**: Fork the repo and clone your fork
2. **Setup**: Run `npm install && npm run install:browsers`
3. **Branch**: Create a feature branch
   (`git checkout -b feature/amazing-feature`)
4. **Code**: Make your changes following our
   [code standards](./CONTRIBUTING.md#code-standards)
5. **Test**: Ensure tests pass (`npm test`)
6. **Commit**: Use [conventional commits](./CONTRIBUTING.md#commit-guidelines)
7. **Push**: Push to your fork and submit a pull request

**First time contributing?** Look for
[`good first issue`](https://github.com/Nuralyio/the-agent/labels/good%20first%20issue)
labels!

## License

This project is licensed under the MIT License. See the `LICENSE` file for
details.

## 🆘 Support & Contact

### 📖 Documentation

- **Main Guide**: [README.md](./README.md) - Setup and usage
- **Contributing**: [CONTRIBUTING.md](./CONTRIBUTING.md) - Development guide
- **Workflows**: [.github/WORKFLOWS.md](./.github/WORKFLOWS.md) - CI/CD
  documentation
- **Package Docs**: Individual README files in each package
- **Changelog**: [CHANGELOG.md](./CHANGELOG.md) - Version history

### 🐛 Issues & Support

- **Bug Reports**:
  [GitHub Issues](https://github.com/Nuralyio/the-agent/issues/new?template=bug_report.md)
- **Feature Requests**:
  [GitHub Issues](https://github.com/Nuralyio/the-agent/issues/new?template=feature_request.md)
- **Questions**:
  [GitHub Discussions](https://github.com/Nuralyio/the-agent/discussions)
- **Security Issues**: Email security@the-agent.dev

### 🚀 Community

- **Discussions**:
  [GitHub Discussions](https://github.com/Nuralyio/the-agent/discussions)
- **Contributing**: See [CONTRIBUTING.md](./CONTRIBUTING.md)
- **Code of Conduct**: Be respectful and inclusive

### Maintainers

- **Project Lead**: [@maintainer](https://github.com/maintainer)
- **Core Team**: [@team](https://github.com/orgs/Nuralyio/teams/the-agent-core)

## 💝 Sponsors

We're grateful for the support from our sponsors who help make this project
possible!

### 🌟 Main Sponsor

<div align="center">
  <a href="https://nuraly.co">
    <strong>Nuraly</strong>
  </a>
  <br/>
  <em>AI platform for building apps</em>
</div>

### 🤝 Become a Sponsor

Support the development of the agent and help us build the future of AI-powered
browser automation!

**Why Sponsor?**

- 🚀 Accelerate feature development
- 🛠️ Priority support and feature requests
- 📈 Your logo featured here and in our documentation
- 🎯 Help shape the project roadmap

**How to Sponsor:**

- [GitHub Sponsors](https://github.com/sponsors/Nuralyio) - Preferred method

## 🎯 Roadmap

- [ ] Additional AI provider integrations
- [ ] Enhanced element detection algorithms
- [ ] Mobile browser automation support
- [ ] Cloud deployment templates
- [ ] Performance benchmarking tools
- [ ] Plugin system architecture

---

**Note**: This is an active development project. Features and APIs may change.
Please check the documentation and releases for the latest updates.
