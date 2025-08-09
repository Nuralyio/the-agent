# @theagent/cli

Command-line interface for the browser automation framework. Provides easy-to-use commands for running automation tasks, managing projects, and executing tests.

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
