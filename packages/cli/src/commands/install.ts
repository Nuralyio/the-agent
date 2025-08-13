import { createLogger } from '../utils/logger';
import { checkBrowserInstallations, autoInstallBrowsers, suggestBrowserInstallation } from '../utils/installer';

export interface InstallOptions {
  playwright?: boolean;
  puppeteer?: boolean;
  force?: boolean;
  check?: boolean;
}

export async function installCommand(options: InstallOptions = {}) {
  const logger = createLogger();
  
  try {
    if (options.check) {
      // Just check browser installations
      logger.info('🔍 Checking browser installations...');
      await checkBrowserInstallations();
      process.exit(0);
      return;
    }

    logger.info('🚀 Browser Installation Manager');
    
    // Check current status
    const status = await checkBrowserInstallations();
    
    let adaptersToInstall: string[] = [];
    
    if (options.playwright) {
      adaptersToInstall.push('playwright');
    }
    
    if (options.puppeteer) {
      adaptersToInstall.push('puppeteer');
    }
    
    // If no specific adapter specified, install based on what's missing
    if (adaptersToInstall.length === 0) {
      if (!status.playwright) {
        adaptersToInstall.push('playwright');
      }
      if (!status.puppeteer) {
        adaptersToInstall.push('puppeteer');
      }
    }
    
    if (adaptersToInstall.length === 0 && !options.force) {
      logger.success('✅ All browser dependencies are already installed!');
      process.exit(0);
      return;
    }
    
    // Install browsers
    for (const adapter of adaptersToInstall) {
      logger.info(`\n📦 Installing ${adapter} browsers...`);
      
      const success = await autoInstallBrowsers(adapter);
      
      if (!success) {
        logger.error(`❌ Failed to install ${adapter} browsers`);
        await suggestBrowserInstallation(adapter);
        process.exit(1);
        return;
      }
    }
    
    logger.success('🎉 Browser installation completed successfully!');
    logger.info('\n✨ You can now run automation tasks:');
    logger.info('   theagent run "navigate to google.com"');
    
    process.exit(0);
  } catch (error) {
    logger.error(`Installation failed: ${error}`);
    process.exit(1);
  }
}
