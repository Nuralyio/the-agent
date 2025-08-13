import { exec } from 'child_process';
import { promisify } from 'util';
import { createLogger } from './logger';

const execAsync = promisify(exec);
const logger = createLogger();

// Try to import Playwright, but handle cases where it's not installed
let playwright: any = null;
try {
  playwright = require('playwright');
} catch (error) {
  // Playwright not installed, will handle this in the functions
}

export interface InstallationStatus {
  playwright: boolean;
  puppeteer: boolean;
  chrome: boolean;
  firefox: boolean;
  edge: boolean;
}

export async function checkBrowserInstallations(): Promise<InstallationStatus> {
  const status: InstallationStatus = {
    playwright: false,
    puppeteer: false,
    chrome: false,
    firefox: false,
    edge: false
  };

  try {
    // Check if Playwright is available and browsers are installed
    if (playwright) {
      try {
        // Check if Playwright browsers are installed by trying to get their paths
        const browsers = ['chromium', 'firefox', 'webkit'];
        let playwrightBrowsersFound = 0;
        
        for (const browserName of browsers) {
          try {
            const browserType = playwright[browserName];
            if (browserType) {
              // Try to get the executable path - this will work if browser is installed
              const executablePath = browserType.executablePath();
              if (executablePath) {
                playwrightBrowsersFound++;
              }
            }
          } catch {
            // Browser not installed
          }
        }
        
        if (playwrightBrowsersFound > 0) {
          status.playwright = true;
          logger.info(`✅ Playwright found with ${playwrightBrowsersFound} browser(s)`);
        } else {
          logger.warn('⚠️  Playwright installed but no browsers found');
        }
      } catch (error) {
        logger.warn('⚠️  Playwright found but browser check failed');
      }
    } else {
      // Fallback to CLI check if Playwright module not available
      try {
        await execAsync('npx playwright --version');
        status.playwright = true;
        logger.info('✅ Playwright CLI found');
      } catch {
        logger.warn('⚠️  Playwright not found');
      }
    }

    // Check if Puppeteer is available
    try {
      const puppeteer = require('puppeteer');
      // Try to get the executable path
      const executablePath = puppeteer.executablePath();
      if (executablePath) {
        status.puppeteer = true;
        logger.info('✅ Puppeteer found');
      }
    } catch {
      logger.warn('⚠️  Puppeteer not found');
    }

    // Check for Chrome/Chromium
    try {
      const commands = [
        'google-chrome --version',
        'chromium --version',
        'chromium-browser --version',
        '/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --version'
      ];

      for (const cmd of commands) {
        try {
          await execAsync(cmd);
          status.chrome = true;
          logger.info('✅ Chrome/Chromium found');
          break;
        } catch {
          // Continue to next command
        }
      }

      if (!status.chrome) {
        logger.warn('⚠️  Chrome/Chromium not found');
      }
    } catch {
      logger.warn('⚠️  Chrome/Chromium not found');
    }

    // Check for Firefox
    try {
      const commands = [
        'firefox --version',
        '/Applications/Firefox.app/Contents/MacOS/firefox --version'
      ];

      for (const cmd of commands) {
        try {
          await execAsync(cmd);
          status.firefox = true;
          logger.info('✅ Firefox found');
          break;
        } catch {
          // Continue to next command
        }
      }

      if (!status.firefox) {
        logger.warn('⚠️  Firefox not found');
      }
    } catch {
      logger.warn('⚠️  Firefox not found');
    }

    // Check for Edge (mainly on macOS)
    try {
      await execAsync('/Applications/Microsoft\\ Edge.app/Contents/MacOS/Microsoft\\ Edge --version');
      status.edge = true;
      logger.info('✅ Microsoft Edge found');
    } catch {
      logger.warn('⚠️  Microsoft Edge not found');
    }

  } catch (error) {
    logger.error(`Error checking browser installations: ${error}`);
  }

  return status;
}

export async function installPlaywrightBrowsers(): Promise<boolean> {
  try {
    logger.info('🔄 Installing Playwright browsers...');
    logger.info('This may take a few minutes...');
    
    if (playwright) {
      // Use Playwright's programmatic API
      try {
        logger.info('📦 Installing browsers using Playwright API...');
        
        // Install browsers programmatically
        const { installBrowsers } = require('playwright/lib/install/installer');
        
        await installBrowsers();
        
        logger.success('✅ Playwright browsers installed successfully using API!');
        return true;
      } catch (apiError: any) {
        logger.warn(`API installation failed: ${apiError.message}, falling back to CLI...`);
      }
    }
    
    // Fallback to CLI installation
    const { stdout, stderr } = await execAsync('npx playwright install', {
      timeout: 300000 // 5 minutes timeout
    });
    
    if (stdout) {
      logger.info('📦 Playwright installation output:');
      console.log(stdout);
    }
    
    if (stderr && !stderr.includes('warning')) {
      logger.warn('Installation warnings:');
      console.warn(stderr);
    }
    
    logger.success('✅ Playwright browsers installed successfully!');
    return true;
  } catch (error: any) {
    logger.error(`❌ Failed to install Playwright browsers: ${error.message}`);
    return false;
  }
}

export async function installPuppeteerBrowser(): Promise<boolean> {
  try {
    logger.info('🔄 Installing Puppeteer browser...');
    
    try {
      // Try to use Puppeteer programmatically
      const puppeteer = require('puppeteer');
      
      // Check if browser is already installed
      try {
        const executablePath = puppeteer.executablePath();
        if (executablePath) {
          logger.success('✅ Puppeteer browser is already available!');
          return true;
        }
      } catch {
        // Browser not installed, continue with installation
      }
      
      // Create a browser instance to trigger download
      logger.info('📦 Downloading Puppeteer browser...');
      const browser = await puppeteer.launch({ headless: true });
      await browser.close();
      
      logger.success('✅ Puppeteer browser installed successfully!');
      return true;
    } catch (puppeteerError: any) {
      logger.warn(`Puppeteer installation failed: ${puppeteerError.message}`);
      
      // Fallback: try to install via npm
      logger.info('📦 Trying to install Puppeteer via npm...');
      const { stdout, stderr } = await execAsync('npm install puppeteer', {
        timeout: 180000
      });
      
      if (stdout) {
        logger.info('NPM installation output:');
        console.log(stdout);
      }
      
      logger.success('✅ Puppeteer installed via npm!');
      return true;
    }
  } catch (error: any) {
    logger.error(`❌ Failed to install Puppeteer browser: ${error.message}`);
    return false;
  }
}

export async function suggestBrowserInstallation(adapter: string): Promise<void> {
  const status = await checkBrowserInstallations();
  
  logger.info('\n📋 Browser Installation Status:');
  logger.info(`   Playwright: ${status.playwright ? '✅' : '❌'}`);
  logger.info(`   Puppeteer: ${status.puppeteer ? '✅' : '❌'}`);
  logger.info(`   Chrome: ${status.chrome ? '✅' : '❌'}`);
  logger.info(`   Firefox: ${status.firefox ? '✅' : '❌'}`);
  logger.info(`   Edge: ${status.edge ? '✅' : '❌'}`);
  
  const needsInstallation = [];
  
  if (adapter === 'playwright' && !status.playwright) {
    needsInstallation.push('Playwright browsers');
  }
  
  if (adapter === 'puppeteer' && !status.puppeteer) {
    needsInstallation.push('Puppeteer browser');
  }
  
  if (needsInstallation.length > 0) {
    logger.warn(`\n⚠️  Missing dependencies for ${adapter}:`);
    needsInstallation.forEach(dep => logger.warn(`   - ${dep}`));
    
    logger.info('\n🔧 Installation suggestions:');
    
    if (adapter === 'playwright') {
      logger.info('   1. Install Playwright browsers:');
      logger.info('      npx playwright install');
      logger.info('   2. Or use the CLI auto-install:');
      logger.info('      theagent run "your task" --install-browsers');
    }
    
    if (adapter === 'puppeteer') {
      logger.info('   1. Install Puppeteer (with Chromium):');
      logger.info('      npm install puppeteer');
      logger.info('   2. Or use the CLI auto-install:');
      logger.info('      theagent run "your task" --install-browsers');
    }
  }
}

export async function installSpecificPlaywrightBrowser(browserName: string): Promise<boolean> {
  try {
    logger.info(`🔄 Installing Playwright ${browserName} browser...`);
    
    if (playwright) {
      try {
        // Use Playwright's programmatic API for specific browser
        const browserType = playwright[browserName];
        if (browserType) {
          logger.info(`📦 Installing ${browserName} using Playwright API...`);
          
          // For newer versions of Playwright, we can use the install method
          if (typeof browserType.install === 'function') {
            await browserType.install();
          } else {
            // Fallback to CLI for specific browser
            await execAsync(`npx playwright install ${browserName}`, {
              timeout: 300000
            });
          }
          
          logger.success(`✅ Playwright ${browserName} installed successfully!`);
          return true;
        } else {
          throw new Error(`Browser ${browserName} not supported`);
        }
      } catch (apiError: any) {
        logger.warn(`API installation failed: ${apiError.message}, falling back to CLI...`);
      }
    }
    
    // Fallback to CLI installation
    const { stdout, stderr } = await execAsync(`npx playwright install ${browserName}`, {
      timeout: 300000
    });
    
    if (stdout) {
      logger.info(`📦 ${browserName} installation output:`);
      console.log(stdout);
    }
    
    logger.success(`✅ Playwright ${browserName} installed successfully!`);
    return true;
  } catch (error: any) {
    logger.error(`❌ Failed to install Playwright ${browserName}: ${error.message}`);
    return false;
  }
}

export async function autoInstallBrowsers(adapter: string): Promise<boolean> {
  logger.info('🚀 Starting automatic browser installation...');
  
  switch (adapter) {
    case 'playwright':
      return await installPlaywrightBrowsers();
    
    case 'puppeteer':
      return await installPuppeteerBrowser();
    
    default:
      logger.warn(`Auto-installation not supported for adapter: ${adapter}`);
      return false;
  }
}
