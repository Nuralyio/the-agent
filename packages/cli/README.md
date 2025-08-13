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

### 1. Initialize a new project

```bash
theagent init my-automation-project
cd my-automation-project
npm install
```

### 2. Run your first automation

```bash
theagent run "navigate to https://example.com and take a screenshot"
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

# With options
theagent run "navigate to example.com" --browser firefox --headless --output screenshot.png
```

### `theagent init [name]`

Initialize a new The Agent automation project.

**Options:**
- `-f, --force` - Overwrite existing directory
- `-t, --template <name>` - Project template

**Example:**
```bash
theagent init my-project
theagent init my-project --force
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
    provider: 'ollama',
    model: 'llama3.1',
    baseUrl: 'http://localhost:11434'
  },
  screenshots: {
    enabled: true,
    path: './screenshots'
  }
};
```

### Configuration Options

- **adapter**: Automation adapter (`playwright`, `puppeteer`, `selenium`)
- **browser**: Default browser (`chrome`, `firefox`, `safari`, `edge`)
- **headless**: Run browser in headless mode
- **timeout**: Default timeout for operations (ms)
- **retries**: Number of retries on failure
- **ai**: AI configuration for intelligent automation
  - **provider**: AI provider (`ollama`, `openai`, `anthropic`)
  - **model**: AI model name
  - **baseUrl**: Base URL for local AI providers
  - **apiKey**: API key for cloud providers
- **screenshots**: Screenshot settings
  - **enabled**: Enable automatic screenshots
  - **path**: Directory for screenshots

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

## Project Structure

When you initialize a project with `theagent init`, it creates:

```
my-project/
├── src/
│   └── index.js          # Main automation script
├── tests/
│   └── example.test.js   # Example tests
├── screenshots/          # Screenshot directory
├── package.json
├── theagent.config.js    # Configuration
├── README.md
└── .gitignore
```

## Testing

Write tests using familiar syntax:

```javascript
const { BrowserAutomation } = require('@theagent/core');

describe('My Tests', () => {
  let automation;

  beforeEach(async () => {
    automation = new BrowserAutomation({ headless: true });
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

- `THEAGENT_ADAPTER` - Default adapter
- `THEAGENT_HEADLESS` - Run in headless mode (true/false)
- `THEAGENT_AI_PROVIDER` - AI provider
- `THEAGENT_AI_MODEL` - AI model
- `THEAGENT_AI_API_KEY` - AI API key

## Troubleshooting

### Common Issues

1. **Browser not found**: Make sure the browser is installed
   ```bash
   # Install browsers for Playwright
   npx playwright install
   ```

2. **AI provider not available**: Check AI service configuration
   ```bash
   # For Ollama
   ollama run llama3.1
   ```

3. **Timeout errors**: Increase timeout in configuration
   ```bash
   theagent config --set timeout --value 60000
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
