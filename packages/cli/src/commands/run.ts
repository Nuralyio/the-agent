import { TheAgent } from '@theagent/core';
import { RunOptions } from '../types';
import { formatDuration, getBrowserType } from '../utils/browser';
import { loadConfig } from '../utils/config';
import { autoInstallBrowsers, checkBrowserInstallations, suggestBrowserInstallation } from '../utils/installer';
import { createLogger } from '../utils/logger';

export async function runCommand(task: string, options: RunOptions) {
  const logger = createLogger();

  try {
    // Load configuration
    const config = await loadConfig(options.config);

    const adapter = options.adapter || config.adapter;

    // Handle browser check option
    if (options.checkBrowsers) {
      logger.info('🔍 Checking browser installations...');
      await suggestBrowserInstallation(adapter);
      process.exit(0);
      return;
    }

    // Check and optionally install browsers
    const status = await checkBrowserInstallations();
    const needsInstallation = (adapter === 'playwright' && !status.playwright) ||
      (adapter === 'puppeteer' && !status.puppeteer);

    if (needsInstallation) {
      if (options.installBrowsers) {
        logger.info(`🔧 Auto-installing browsers for ${adapter}...`);
        const installSuccess = await autoInstallBrowsers(adapter);

        if (!installSuccess) {
          logger.error(`❌ Failed to install browsers for ${adapter}`);
          await suggestBrowserInstallation(adapter);
          process.exit(1);
          return;
        }

        logger.success(`✅ Browsers installed successfully for ${adapter}!`);
      } else {
        logger.warn(`⚠️  Browser dependencies missing for ${adapter}`);
        await suggestBrowserInstallation(adapter);
        logger.info('💡 Tip: Use --install-browsers to auto-install or run:');
        logger.info(`   theagent install --${adapter}`);
        process.exit(1);
        return;
      }
    }

    // Override AI configuration with command-line options
    const aiConfig = {
      provider: options.aiProvider || config.ai.provider,
      model: options.aiModel || config.ai.model,
      baseUrl: options.aiBaseUrl || config.ai.baseUrl,
      apiKey: options.aiApiKey || config.ai.apiKey
    };

    logger.info(`🤖 Starting The Agent automation task: ${task}`);
    logger.info(`📋 Configuration:`);
    logger.info(`   Adapter: ${options.adapter || config.adapter}`);
    logger.info(`   Browser: ${options.browser || config.browser}`);
    logger.info(`   Headless: ${options.headless ?? config.headless}`);
    logger.info(`   AI Provider: ${aiConfig.provider}`);
    logger.info(`   AI Model: ${aiConfig.model}`);

    const automation = new TheAgent({
      adapter: options.adapter || config.adapter,
      browserType: getBrowserType(options.browser || config.browser),
      headless: options.headless ?? config.headless,
      ai: aiConfig
    });

    logger.info('🚀 Initializing The Agent...');
    await automation.initialize();

    const startTime = Date.now();
    const result = await automation.execute(task, {
      timeout: options.timeout || config.timeout,
      retries: options.retries || config.retries
    });
    const duration = Date.now() - startTime;

    if (options.output && config.screenshots.enabled) {
      await automation.screenshot({ path: options.output });
      logger.success(`📸 Screenshot saved to ${options.output}`);
    }

    await automation.close();

    if (result.success) {
      logger.success(`✅ Task completed successfully in ${formatDuration(duration)}`);

      if (result.steps && result.steps.length > 0) {
        logger.info(`📊 Execution Summary:`);
        logger.info(`   Steps executed: ${result.steps.length}`);

        result.steps.forEach((step, index) => {
          logger.info(`   ${index + 1}. ${step.description}`);
        });
      }

      if (result.extractedData) {
        logger.info(`📦 Data extracted: ${JSON.stringify(result.extractedData, null, 2)}`);
      }

      process.exit(0);
    } else {
      logger.error(`❌ Task failed: ${result.error}`);
      process.exit(1);
    }
  } catch (error) {
    logger.error(`💥 Execution failed: ${error instanceof Error ? error.message : error}`);

    if (error instanceof Error && error.stack) {
      logger.debug(`Stack trace: ${error.stack}`);
    }

    process.exit(1);
  }
}
