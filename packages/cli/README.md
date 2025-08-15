# @theagent/cli

Command-line interface for The Agent - an intelligent browser automation framework that enables natural language automation tasks.

## Installation

```bash
npm install -g @theagent/cli
```

Or install in your project:

```bash
npm install @theagent/cli
```

## Quick Start

### 1. Install The Agent CLI

```bash
npm install -g @theagent/cli
```

### 2. Configure AI Provider (Optional)

```bash
# For OpenAI (default)
export OPENAI_API_KEY="your-api-key"

# For local Ollama
theagent config --set ai.provider --value ollama
```

### 3. Run your first automation

```bash
theagent run "navigate to https://example.com and take a screenshot"
```

### 4. Install browsers if needed

```bash
theagent install --check  # Check browser status
theagent install          # Install missing browsers
```

## Commands

### `theagent run <task>`

Execute an automation task using natural language.

**Options:**
- `-b, --browser <type>` - Browser type (chrome, firefox, safari, edge)
- `-a, --adapter <name>` - Adapter (playwright, puppeteer, selenium)
- `--headless` - Run in headless mode
- `-o, --output <path>` - Screenshot output path
- `-c, --config <path>` - Configuration file path
- `-t, --timeout <ms>` - Timeout in milliseconds
- `-r, --retries <count>` - Number of retries on failure
- `--ai-provider <provider>` - AI provider (ollama, openai, anthropic, mistral)
- `--ai-model <model>` - AI model to use
- `--ai-api-key <key>` - AI API key for cloud providers
- `--ai-base-url <url>` - AI base URL for local providers
- `--install-browsers` - Automatically install browser dependencies if missing
- `--check-browsers` - Check browser installation status without running task

**Examples:**
```bash
# Basic navigation
theagent run "go to https://google.com"

# Search and interaction
theagent run "search for 'automation' on google and click the first result"

# Form filling
theagent run "fill in the contact form with name 'John' and email 'john@example.com'"

# Data extraction
theagent run "extract all product titles from this page"

# With AI provider options
theagent run "navigate to example.com" --browser firefox --headless --output screenshot.png --ai-provider ollama --ai-model llama3.1

# With automatic browser installation
theagent run "search for 'automation' on google" --install-browsers

# Check browser status before running
theagent run "fill contact form" --check-browsers
```

### `theagent test`

Run automation tests.

**Options:**
- `-f, --filter <pattern>` - Filter tests by name pattern
- `--headless` - Run tests in headless mode
- `-r, --reporter <type>` - Test reporter (default, json)
- `-t, --timeout <ms>` - Test timeout

**Examples:**
```bash
theagent test
theagent test --filter "login"
theagent test --headless --reporter json
```

### `theagent config`

Manage The Agent configuration.

**Options:**
- `-l, --list` - List all configuration values
- `--get <key>` - Get a configuration value
- `--set <key> --value <value>` - Set a configuration value

**Examples:**
```bash
# View current config
theagent config --list

# Get specific value
theagent config --get adapter

# Set values
theagent config --set adapter --value playwright
theagent config --set headless --value true
theagent config --set ai.provider --value ollama
```

### `theagent install`

Install browser dependencies for automation adapters.

**Options:**
- `--playwright` - Install Playwright browsers (chromium, firefox, webkit)
- `--puppeteer` - Install Puppeteer browser (chromium)
- `--force` - Force reinstallation even if already installed
- `--check` - Only check installation status without installing

**Examples:**
```bash
# Install all missing browsers
theagent install

# Install only Playwright browsers
theagent install --playwright

# Check browser installation status
theagent install --check

# Force reinstall all browsers
theagent install --force
```

### `theagent examples`

Show usage examples and common patterns.

## Configuration

The Agent uses a configuration file (`theagent.config.js`) to set default options:

```javascript
module.exports = {
  adapter: 'playwright',
  browser: 'chrome',
  headless: false,
  timeout: 30000,
  retries: 3,
  ai: {
    provider: 'openai',  // ollama, openai, anthropic, mistral
    model: 'gpt-4o',     // Model specific to provider
    baseUrl: 'https://api.openai.com/v1',  // For local providers like Ollama
    apiKey: process.env.OPENAI_API_KEY     // API key for cloud providers
  },
  screenshots: {
    enabled: true,
    path: './screenshots'
  }
};
```

### AI Provider Configuration

The Agent supports multiple AI providers for intelligent automation:

#### OpenAI (Default)
```bash
theagent config --set ai.provider --value openai
theagent config --set ai.model --value gpt-4o
export OPENAI_API_KEY="your-api-key"
```

#### Anthropic Claude
```bash
theagent config --set ai.provider --value anthropic
theagent config --set ai.model --value claude-3-sonnet
export ANTHROPIC_API_KEY="your-api-key"
```

#### Ollama (Local)
```bash
theagent config --set ai.provider --value ollama
theagent config --set ai.model --value llama3.1
theagent config --set ai.baseUrl --value http://localhost:11434
```

#### Mistral AI
```bash
theagent config --set ai.provider --value mistral
theagent config --set ai.model --value mistral-large
export MISTRAL_API_KEY="your-api-key"
```

#### Command-line AI Options
You can also specify AI settings per command:
```bash
theagent run "your task" --ai-provider openai --ai-model gpt-4 --ai-api-key "your-key"
theagent run "your task" --ai-provider ollama --ai-model llama3.1 --ai-base-url http://localhost:11434
```

### Configuration Options

- **adapter**: Automation adapter (`playwright`, `puppeteer`, `selenium`)
- **browser**: Default browser (`chrome`, `firefox`, `safari`, `edge`)
- **headless**: Run browser in headless mode
- **timeout**: Default timeout for operations (ms)
- **retries**: Number of retries on failure
- **ai**: AI configuration for intelligent automation
  - **provider**: AI provider (`ollama`, `openai`, `anthropic`, `mistral`)
  - **model**: AI model name (provider-specific)
    - OpenAI: `gpt-4o`, `gpt-4`, `gpt-3.5-turbo`
    - Anthropic: `claude-3-opus`, `claude-3-sonnet`, `claude-3-haiku`
    - Ollama: `llama3.1`, `codellama`, `mistral`
    - Mistral: `mistral-large`, `mistral-medium`, `mistral-small`
  - **baseUrl**: Base URL for local AI providers (e.g., `http://localhost:11434` for Ollama)
  - **apiKey**: API key for cloud providers (OpenAI, Anthropic, Mistral)
- **screenshots**: Screenshot settings
  - **enabled**: Enable automatic screenshots
  - **path**: Directory for screenshots

## Browser Management

The Agent provides automatic browser management to ensure all required browsers are installed and available:

### Automatic Installation

The CLI can automatically install missing browsers when running tasks:

```bash
# Auto-install browsers if missing during task execution
theagent run "navigate to example.com" --install-browsers

# Check browser status before running
theagent run "search for products" --check-browsers
```

### Manual Installation

Use the dedicated install command for manual browser management:

```bash
# Install all missing browsers
theagent install

# Install only Playwright browsers (chromium, firefox, webkit)
theagent install --playwright

# Install only Puppeteer browser (chromium)
theagent install --puppeteer

# Check installation status
theagent install --check

# Force reinstall even if already present
theagent install --force
```

### Supported Browsers

- **Playwright**: Installs Chromium, Firefox, and WebKit browsers
- **Puppeteer**: Installs Chromium browser
- **System Browsers**: Detects Chrome, Firefox, Safari, and Edge if installed

## Natural Language Tasks

The Agent understands natural language instructions for browser automation:

### Navigation
- "go to https://example.com"
- "navigate to google.com"
- "visit the homepage"

### Interaction
- "click the login button"
- "type 'hello world' in the search box"
- "select 'Option 1' from the dropdown"
- "check the agreement checkbox"

### Forms
- "fill in the form with name 'John' and email 'john@example.com'"
- "submit the contact form"
- "upload file 'document.pdf'"

### Data Extraction
- "get all product titles"
- "extract the page title"
- "find all links on the page"
- "get the text from the first paragraph"

### Screenshots and Validation
- "take a screenshot"
- "check if the error message is visible"
- "verify the page title contains 'Welcome'"

### Complex Workflows
- "login with username 'user' and password 'pass', then navigate to dashboard"
- "search for products, filter by price, and add the first item to cart"

## Project Setup

To use The Agent in your own project, create a simple automation script:

```javascript
// automation.js
const { TheAgent } = require('@theagent/core');

async function runAutomation() {
  const automation = new TheAgent({ 
    headless: false,
    ai: { provider: 'openai', model: 'gpt-4o' }
  });
  
  await automation.initialize();
  await automation.execute('Navigate to https://example.com and take a screenshot');
  await automation.close();
}

runAutomation();
```

Or use the CLI directly without any setup:
```bash
theagent run "your automation task"
```

## Testing

Write tests using familiar syntax:

```javascript
const { TheAgent } = require('@theagent/core');

describe('My Tests', () => {
  let automation;

  beforeEach(async () => {
    automation = new TheAgent({ headless: true });
    await automation.initialize();
  });

  afterEach(async () => {
    await automation.close();
  });

  test('should navigate to example.com', async () => {
    await automation.execute('Navigate to https://example.com');
    const title = await automation.getTitle();
    expect(title).toContain('Example');
  });
});
```

## Environment Variables

You can configure The Agent using environment variables:

- `THEAGENT_ADAPTER` - Default adapter (playwright, puppeteer, selenium)
- `THEAGENT_HEADLESS` - Run in headless mode (true/false)
- `THEAGENT_AI_PROVIDER` - AI provider (ollama, openai, anthropic, mistral)
- `THEAGENT_AI_MODEL` - AI model name
- `THEAGENT_AI_API_KEY` - AI API key for cloud providers
- `THEAGENT_AI_BASE_URL` - AI base URL for local providers
- `OPENAI_API_KEY` - OpenAI API key (alternative to THEAGENT_AI_API_KEY)
- `ANTHROPIC_API_KEY` - Anthropic API key (alternative to THEAGENT_AI_API_KEY)
- `MISTRAL_API_KEY` - Mistral API key (alternative to THEAGENT_AI_API_KEY)

## Troubleshooting

### Common Issues

1. **Browser not found**: Make sure the browser is installed or use auto-installation
   ```bash
   # Check browser status
   theagent install --check
   
   # Install browsers automatically
   theagent install
   
   # Install specific browsers
   theagent install --playwright
   theagent install --puppeteer
   
   # Use auto-install during task execution
   theagent run "your task" --install-browsers
   ```

2. **AI provider not available**: Check AI service configuration
   ```bash
   # For Ollama (local)
   ollama run llama3.1
   
   # For OpenAI (cloud)
   export OPENAI_API_KEY="your-api-key"
   theagent config --set ai.provider --value openai
   
   # For Anthropic (cloud)
   export ANTHROPIC_API_KEY="your-api-key"
   theagent config --set ai.provider --value anthropic
   ```

3. **Timeout errors**: Increase timeout in configuration
   ```bash
   theagent config --set timeout --value 60000
   ```

4. **Browser installation fails**: Try manual installation
   ```bash
   # For Playwright
   npx playwright install
   
   # For Puppeteer
   npm install puppeteer
   ```

### Debug Mode

Enable debug output:
```bash
DEBUG=theagent* theagent run "your task"
```

## API Reference

For programmatic usage, see the [@theagent/core](../core/README.md) documentation.

## License

MIT License - see [LICENSE](../../LICENSE) file for details. Provides
easy-to-use commands for running automation tasks, managing projects, and
executing tests.

## Installation

```bash
npm install -g @theagent/cli
```

## Usage

### Run Automation Tasks

```bash
# Basic task execution
theagent run "Take a screenshot of google.com"

# With specific browser and options
theagent run "Fill login form" --browser firefox --adapter playwright --headless

# Save screenshot
theagent run "Navigate to example.com" --output ./screenshot.png
```

### Initialize Project

```bash
# Create new automation project
theagent init
```

### Run Tests

```bash
# Run all tests
theagent test

# Watch mode
theagent test --watch
```

## Commands

- `theagent run <task>` - Execute automation task
- `theagent init` - Initialize new project
- `theagent test` - Run automation tests

## Options

- `-b, --browser <type>` - Browser type (chrome, firefox, safari, edge)
- `-a, --adapter <name>` - Adapter (playwright, puppeteer, selenium)
- `--headless` - Run in headless mode
- `-o, --output <path>` - Screenshot output path
- `-w, --watch` - Watch mode for tests
