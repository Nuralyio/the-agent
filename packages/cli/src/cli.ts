#!/usr/bin/env node

import { Command } from 'commander';
import { runCommand, testCommand, configCommand, installCommand } from './commands';

const program = new Command();

program
  .name('theagent')
  .description('CLI for The Agent - Intelligent browser automation framework')
  .version('0.1.0');

// Run command
program
  .command('run')
  .description('Execute an automation task using natural language')
  .argument('<task>', 'Natural language description of the automation task')
  .option('-b, --browser <type>', 'browser type (chrome, firefox, safari, edge)')
  .option('-a, --adapter <name>', 'adapter to use (playwright, puppeteer, selenium)')
  .option('--headless', 'run in headless mode')
  .option('-o, --output <path>', 'screenshot output path')
  .option('-c, --config <path>', 'path to configuration file')
  .option('-t, --timeout <ms>', 'timeout in milliseconds', parseInt)
  .option('-r, --retries <count>', 'number of retries on failure', parseInt)
  .option('--ai-provider <provider>', 'AI provider (ollama, openai, anthropic, mistral)')
  .option('--ai-model <model>', 'AI model to use')
  .option('--ai-api-key <key>', 'AI API key')
  .option('--ai-base-url <url>', 'AI base URL')
  .option('--install-browsers', 'automatically install browser dependencies if missing')
  .option('--check-browsers', 'check browser installation status without running task')
  .action(runCommand);

// Test command
program
  .command('test')
  .description('Run automation tests')
  .option('-f, --filter <pattern>', 'filter tests by name pattern')
  .option('--headless', 'run tests in headless mode')
  .option('-r, --reporter <type>', 'test reporter (default, json)', 'default')
  .option('-t, --timeout <ms>', 'test timeout in milliseconds', parseInt)
  .action(testCommand);

// Config command
program
  .command('config [key] [value]')
  .description('Manage The Agent configuration')
  .option('-g, --global', 'use global configuration')
  .option('-l, --list', 'list all configuration values')
  .option('--get <key>', 'get a configuration value')
  .option('--set', 'set a configuration key (use with key and value arguments)')
  .action((key, value, options) => {
    if (key && value) {
      // Handle positional arguments for set
      return configCommand({ ...options, set: key, value });
    } else if (options.get) {
      return configCommand({ ...options, get: options.get });
    } else if (options.list) {
      return configCommand({ ...options, list: true });
    } else {
      return configCommand(options);
    }
  });

// Install command
program
  .command('install')
  .description('Install browser dependencies')
  .option('--playwright', 'install Playwright browsers')
  .option('--puppeteer', 'install Puppeteer browser')
  .option('--force', 'force reinstallation even if already installed')
  .option('--check', 'only check installation status')
  .action(installCommand);

// Examples command
program
  .command('examples')
  .description('Show usage examples')
  .action(() => {
    console.log(`
🤖 The Agent - Usage Examples

Basic Navigation:
  theagent run "go to https://example.com"
  theagent run "navigate to google.com"

Search and Interaction:
  theagent run "search for 'automation' on google"
  theagent run "go to github.com and search for 'playwright'"

Form Filling:
  theagent run "go to contact form and fill in name 'John' and email 'john@example.com'"

Data Extraction:
  theagent run "go to news.ycombinator.com and get the top 5 story titles"
  theagent run "extract all product prices from this e-commerce page"

Screenshot and Monitoring:
  theagent run "take a screenshot of the current page" -o screenshot.png
  theagent run "check if login button is visible"

Complex Workflows:
  theagent run "login to dashboard, navigate to reports, and download the latest report"

Configuration:
  theagent config --list
  theagent config ai.provider openai
  theagent config ai.model gpt-4o
  theagent config ai.apiKey your-api-key

AI Provider Usage:
  theagent run "take a screenshot" --ai-provider openai --ai-model gpt-4o
  theagent run "navigate to google" --ai-provider ollama --ai-model llama3.2
  theagent run "search for news" --ai-provider anthropic --ai-model claude-3-sonnet

Browser Installation:
  theagent install --check                    # Check browser status
  theagent install --playwright               # Install Playwright browsers
  theagent install --puppeteer                # Install Puppeteer browser
  theagent install                             # Install all missing browsers
  theagent run "task" --install-browsers       # Auto-install during task
  theagent run "task" --check-browsers         # Check browsers before task

Direct Usage:
  theagent run "navigate to https://example.com"
  theagent run "take a screenshot" -o ./my-screenshot.png
  theagent config browser chrome
`);
    process.exit(0);
  });

// Error handling
program.on('command:*', () => {
  console.error('Invalid command: %s\nSee --help for a list of available commands.', program.args.join(' '));
  process.exit(1);
});

if (process.argv.length === 2) {
  program.help();
}

program.parse();
