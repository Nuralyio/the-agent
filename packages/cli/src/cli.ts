#!/usr/bin/env node

import { BrowserAutomation, BrowserType } from '@theagent/core';
import chalk from 'chalk';
import { Command } from 'commander';

const program = new Command();

program
  .name('theagent')
  .description('CLI for browser automation framework')
  .version('1.0.0');

program
  .command('run')
  .description('Run an automation task')
  .argument('<task>', 'automation task description')
  .option('-b, --browser <type>', 'browser type (chrome, firefox, safari, edge)', 'chrome')
  .option('-a, --adapter <name>', 'adapter to use (playwright, puppeteer, selenium)', 'playwright')
  .option('--headless', 'run in headless mode', false)
  .option('-o, --output <path>', 'screenshot output path')
  .action(async (task, options) => {
    console.log(chalk.blue('🚀 Starting automation task...'));
    console.log(chalk.gray(`Task: ${task}`));
    console.log(chalk.gray(`Browser: ${options.browser}`));
    console.log(chalk.gray(`Adapter: ${options.adapter}`));

    try {
      const automation = new BrowserAutomation({
        adapter: options.adapter,
        browserType: getBrowserType(options.browser),
        headless: options.headless,
      });

      await automation.initialize();
      const result = await automation.execute(task);

      if (options.output) {
        await automation.screenshot(options.output);
        console.log(chalk.green(`📸 Screenshot saved to ${options.output}`));
      }

      await automation.close();
      console.log(chalk.green('✅ Task completed successfully'));
      console.log(result);
    } catch (error) {
      console.error(chalk.red('❌ Task failed:'), error);
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize a new automation project')
  .action(() => {
    console.log(chalk.blue('🔧 Initializing new automation project...'));
    // TODO: Implement project initialization
    console.log(chalk.green('✅ Project initialized'));
  });

program
  .command('test')
  .description('Run automation tests')
  .option('-w, --watch', 'watch mode')
  .action(() => {
    console.log(chalk.blue('🧪 Running tests...'));
    // TODO: Implement test runner
    console.log(chalk.green('✅ Tests completed'));
  });

function getBrowserType(browser: string): BrowserType {
  switch (browser.toLowerCase()) {
    case 'chrome':
    case 'chromium':
      return BrowserType.CHROMIUM;
    case 'firefox':
      return BrowserType.FIREFOX;
    case 'safari':
      return BrowserType.WEBKIT;
    case 'edge':
      return BrowserType.CHROMIUM;
    default:
      return BrowserType.CHROMIUM;
  }
}

program.parse();
