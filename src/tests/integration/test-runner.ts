import { DynamicPlanningTest } from './dynamic-planning.test';
import { FormFillingTest } from './form-filling.test';
import { InteractionTest } from './interaction.test';
import { NavigationTest } from './navigation.test';
import { ScreenshotTest } from './screenshot.test';

/**
 * Master test runner for all integration tests
 */
export class TestRunner {
  private testSuites: Array<{
    name: string;
    instance: any;
    enabled: boolean;
  }>;

  constructor() {
    this.testSuites = [
      {
        name: 'Navigation Tests',
        instance: new NavigationTest(),
        enabled: true
      },
      {
        name: 'Screenshot Tests',
        instance: new ScreenshotTest(),
        enabled: true
      },
      {
        name: 'Form Filling Tests',
        instance: new FormFillingTest(),
        enabled: true
      },
      {
        name: 'Interaction Tests',
        instance: new InteractionTest(),
        enabled: true
      },
      {
        name: 'Dynamic Planning Tests',
        instance: new DynamicPlanningTest(),
        enabled: true
      }
    ];
  }

  /**
   * Run all enabled test suites
   */
  async runAll(): Promise<void> {
    console.log('🚀 === STARTING ALL INTEGRATION TESTS ===');
    console.log(`📊 Running ${this.testSuites.filter(suite => suite.enabled).length} test suites\n`);

    const results: Array<{
      name: string;
      success: boolean;
      error?: Error;
      duration: number;
    }> = [];

    for (const suite of this.testSuites) {
      if (!suite.enabled) {
        console.log(`⏩ Skipping ${suite.name} (disabled)`);
        continue;
      }

      const startTime = Date.now();
      try {
        console.log(`\n🎯 Running ${suite.name}...`);
        await suite.instance.runAll();
        const duration = Date.now() - startTime;

        results.push({
          name: suite.name,
          success: true,
          duration
        });

        console.log(`✅ ${suite.name} completed in ${duration}ms`);
      } catch (error) {
        const duration = Date.now() - startTime;

        results.push({
          name: suite.name,
          success: false,
          error: error as Error,
          duration
        });

        console.error(`❌ ${suite.name} failed in ${duration}ms:`, error);
      }
    }

    this.printSummary(results);
  }

  /**
   * Run specific test suites by name
   */
  async runSpecific(suiteNames: string[]): Promise<void> {
    console.log(`🎯 === RUNNING SPECIFIC TEST SUITES ===`);
    console.log(`📋 Requested suites: ${suiteNames.join(', ')}\n`);

    const suitesToRun = this.testSuites.filter(suite =>
      suiteNames.some(name => suite.name.toLowerCase().includes(name.toLowerCase()))
    );

    if (suitesToRun.length === 0) {
      console.error('❌ No matching test suites found');
      console.log('📋 Available suites:');
      this.testSuites.forEach(suite => console.log(`   - ${suite.name}`));
      return;
    }

    const results: Array<{
      name: string;
      success: boolean;
      error?: Error;
      duration: number;
    }> = [];

    for (const suite of suitesToRun) {
      const startTime = Date.now();
      try {
        console.log(`\n🎯 Running ${suite.name}...`);

        // Setup if the method exists
        if (typeof suite.instance.setup === 'function') {
          await suite.instance.setup();
        }

        await suite.instance.runAll();

        // Teardown if the method exists
        if (typeof suite.instance.teardown === 'function') {
          await suite.instance.teardown();
        }

        const duration = Date.now() - startTime;

        results.push({
          name: suite.name,
          success: true,
          duration
        });

        console.log(`✅ ${suite.name} completed in ${duration}ms`);
      } catch (error) {
        const duration = Date.now() - startTime;

        // Ensure teardown is called even on error
        try {
          if (typeof suite.instance.teardown === 'function') {
            await suite.instance.teardown();
          }
        } catch (teardownError) {
          console.error('❌ Teardown error:', teardownError);
        }

        results.push({
          name: suite.name,
          success: false,
          error: error as Error,
          duration
        });

        console.error(`❌ ${suite.name} failed in ${duration}ms:`, error);
      }
    }

    this.printSummary(results);
  }

  /**
   * Enable or disable specific test suites
   */
  configure(config: { [suiteName: string]: boolean }): void {
    for (const [suiteName, enabled] of Object.entries(config)) {
      const suite = this.testSuites.find(s =>
        s.name.toLowerCase().includes(suiteName.toLowerCase())
      );

      if (suite) {
        suite.enabled = enabled;
        console.log(`🔧 ${suite.name}: ${enabled ? 'enabled' : 'disabled'}`);
      }
    }
  }

  /**
   * Print test execution summary
   */
  private printSummary(results: Array<{
    name: string;
    success: boolean;
    error?: Error;
    duration: number;
  }>): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 === TEST EXECUTION SUMMARY ===');
    console.log('='.repeat(60));

    const totalTests = results.length;
    const passedTests = results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`\n📈 Overall Results:`);
    console.log(`   Total Suites: ${totalTests}`);
    console.log(`   Passed: ${passedTests} ✅`);
    console.log(`   Failed: ${failedTests} ❌`);
    console.log(`   Total Duration: ${totalDuration}ms`);
    console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (results.length > 0) {
      console.log(`\n📋 Detailed Results:`);
      results.forEach(result => {
        const status = result.success ? '✅' : '❌';
        const duration = `${result.duration}ms`;
        console.log(`   ${status} ${result.name} (${duration})`);

        if (!result.success && result.error) {
          console.log(`      Error: ${result.error.message}`);
        }
      });
    }

    const overallSuccess = failedTests === 0;
    console.log(`\n🏁 Overall Result: ${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    console.log('='.repeat(60));
  }

  /**
   * List available test suites
   */
  listSuites(): void {
    console.log('📋 Available Test Suites:');
    this.testSuites.forEach(suite => {
      const status = suite.enabled ? '✅' : '❌';
      console.log(`   ${status} ${suite.name}`);
    });
  }

  /**
   * Run all test suites in parallel
   */
  async runAllParallel(): Promise<void> {
    const enabledSuites = this.testSuites.filter(suite => suite.enabled);
    console.log(`\n🚀 Running ${enabledSuites.length} test suites in parallel...`);

    const startTime = Date.now();
    const results = await Promise.allSettled(
      enabledSuites.map(async (suite) => {
        try {
          console.log(`\n🎯 Starting ${suite.name}...`);
          
          // Setup if the method exists
          if (typeof suite.instance.setup === 'function') {
            await suite.instance.setup();
          }

          await suite.instance.runAll();

          // Teardown if the method exists
          if (typeof suite.instance.teardown === 'function') {
            await suite.instance.teardown();
          }

          return { name: suite.name, success: true };
        } catch (error) {
          // Ensure teardown is called even on error
          try {
            if (typeof suite.instance.teardown === 'function') {
              await suite.instance.teardown();
            }
          } catch (teardownError) {
            console.error('❌ Teardown error:', teardownError);
          }

          return { name: suite.name, success: false, error: error as Error };
        }
      })
    );

    const totalDuration = Date.now() - startTime;
    const processedResults = results.map((result, index) => {
      const suite = enabledSuites[index];
      if (!suite) throw new Error(`Suite at index ${index} not found`);
      
      return {
        name: suite.name,
        success: result.status === 'fulfilled' && result.value.success,
        error: result.status === 'rejected' ? result.reason : 
               (result.status === 'fulfilled' && !result.value.success ? result.value.error : undefined),
        duration: totalDuration / results.length // Approximate since parallel
      };
    });

    this.printSummary(processedResults);
  }

  /**
   * Run specific test suites in parallel
   */
  async runSpecificParallel(suiteNames: string[]): Promise<void> {
    const suitesToRun = this.findSuitesByNames(suiteNames);
    
    if (suitesToRun.length === 0) {
      console.log('❌ No matching test suites found.');
      this.listSuites();
      return;
    }

    console.log(`\n🚀 Running ${suitesToRun.length} test suites in parallel...`);

    const startTime = Date.now();
    const results = await Promise.allSettled(
      suitesToRun.map(async (suite) => {
        try {
          console.log(`\n🎯 Starting ${suite.name}...`);
          
          // Setup if the method exists
          if (typeof suite.instance.setup === 'function') {
            await suite.instance.setup();
          }

          await suite.instance.runAll();

          // Teardown if the method exists
          if (typeof suite.instance.teardown === 'function') {
            await suite.instance.teardown();
          }

          return { name: suite.name, success: true };
        } catch (error) {
          // Ensure teardown is called even on error
          try {
            if (typeof suite.instance.teardown === 'function') {
              await suite.instance.teardown();
            }
          } catch (teardownError) {
            console.error('❌ Teardown error:', teardownError);
          }

          return { name: suite.name, success: false, error: error as Error };
        }
      })
    );

    const totalDuration = Date.now() - startTime;
    const processedResults = results.map((result, index) => {
      const suite = suitesToRun[index];
      if (!suite) throw new Error(`Suite at index ${index} not found`);
      
      return {
        name: suite.name,
        success: result.status === 'fulfilled' && result.value.success,
        error: result.status === 'rejected' ? result.reason : 
               (result.status === 'fulfilled' && !result.value.success ? result.value.error : undefined),
        duration: totalDuration / results.length // Approximate since parallel
      };
    });

    this.printSummary(processedResults);
  }

  /**
   * Helper method to find suites by names
   */
  private findSuitesByNames(suiteNames: string[]) {
    return this.testSuites.filter(suite => 
      suite.enabled && suiteNames.some(name => {
        if (!name) return false;
        const suiteName = suite.name.toLowerCase();
        const searchName = name.toLowerCase();
        const firstWord = suiteName.split(' ')[0];
        return suiteName.includes(searchName) || 
               searchName.includes(firstWord || '');
      })
    );
  }
}

// CLI interface when run directly
if (require.main === module) {
  const runner = new TestRunner();
  
  interface CLIOptions {
    suites: string[];
    headless?: boolean;
    browser?: string | undefined;
    adapter?: string | undefined;
    list?: boolean;
    help?: boolean;
    parallel?: boolean;
    timeout?: number | undefined;
    verbose?: boolean;
  }

  function parseArgs(): CLIOptions {
    const args = process.argv.slice(2);
    const options: CLIOptions = { suites: [] };
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      switch (arg) {
        case '--list':
        case '-l':
          options.list = true;
          break;
        case '--help':
        case '-h':
          options.help = true;
          break;
        case '--headless':
          options.headless = true;
          break;
        case '--headed':
          options.headless = false;
          break;
        case '--browser':
        case '-b':
          if (i + 1 < args.length && args[i + 1]) {
            options.browser = args[++i];
          }
          break;
        case '--adapter':
        case '-a':
          if (i + 1 < args.length && args[i + 1]) {
            options.adapter = args[++i];
          }
          break;
        case '--parallel':
        case '-p':
          options.parallel = true;
          break;
        case '--timeout':
        case '-t':
          if (i + 1 < args.length && args[i + 1]) {
            const timeoutValue = args[++i];
            if (timeoutValue) {
              options.timeout = parseInt(timeoutValue, 10);
            }
          }
          break;
        case '--verbose':
        case '-v':
          options.verbose = true;
          break;
        default:
          if (arg && !arg.startsWith('-')) {
            options.suites.push(arg);
          }
          break;
      }
    }
    
    return options;
  }

  function showHelp(): void {
    console.log(`
🧪 Browser Automation Test Runner

Usage: npm test [options] [suites...]

Options:
  -l, --list              List available test suites
  -h, --help              Show this help message
  --headless              Run tests in headless mode
  --headed                Run tests in headed mode (default)
  -b, --browser <type>    Browser type (chrome, firefox, safari, edge)
  -a, --adapter <type>    Adapter type (playwright, puppeteer, selenium)
  -p, --parallel          Run tests in parallel (when possible)
  -t, --timeout <ms>      Test timeout in milliseconds
  -v, --verbose           Enable verbose output

Test Suites:
  navigation              Navigation functionality tests
  screenshot              Screenshot capture tests  
  form                    Form filling tests
  interaction             Browser interaction tests
  planning                Dynamic planning tests
  all                     Run all test suites (default)

Examples:
  npm test                          # Run all tests
  npm test form navigation          # Run specific suites
  npm test --list                   # List available suites
  npm test --headless form          # Run forms test headless
  npm test --browser firefox --adapter playwright form
  npm test --parallel all           # Run all tests in parallel
  npm test --timeout 60000 form     # Set custom timeout
`);
  }

  async function main() {
    try {
      const options = parseArgs();
      
      if (options.help) {
        showHelp();
        return;
      }
      
      if (options.list) {
        runner.listSuites();
        return;
      }

      // Apply environment overrides if specified
      if (options.headless !== undefined) {
        process.env.BROWSER_HEADLESS = options.headless.toString();
      }
      if (options.browser) {
        process.env.BROWSER_TYPE = options.browser;
      }
      if (options.adapter) {
        process.env.BROWSER_ADAPTER = options.adapter;
      }
      if (options.timeout) {
        process.env.TEST_TIMEOUT = options.timeout.toString();
      }
      if (options.verbose) {
        process.env.VERBOSE = 'true';
      }

      console.log('🎯 === RUNNING BROWSER AUTOMATION TESTS ===');
      
      if (options.suites.length === 0 || options.suites.includes('all')) {
        console.log('📋 Running all test suites');
        if (options.parallel) {
          console.log('⚡ Parallel execution enabled');
          await runner.runAllParallel();
        } else {
          await runner.runAll();
        }
      } else {
        console.log(`📋 Requested suites: ${options.suites.join(', ')}`);
        if (options.parallel && options.suites.length > 1) {
          console.log('⚡ Parallel execution enabled');
          await runner.runSpecificParallel(options.suites);
        } else {
          await runner.runSpecific(options.suites);
        }
      }
    } catch (error) {
      console.error('💥 Test runner failed:', error);
      process.exit(1);
    }
    
    // Ensure clean exit with a timeout fallback
    setTimeout(() => {
      console.log('⚠️ Forcing exit after timeout...');
      process.exit(0);
    }, 1000); // Give 1 second for cleanup
    
    process.exit(0);
  }

  main();

  // Handle process termination signals for clean exit
  process.on('SIGINT', () => {
    console.log('\n⚠️ Received SIGINT, forcing exit...');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n⚠️ Received SIGTERM, forcing exit...');
    process.exit(0);
  });

  process.on('SIGHUP', () => {
    console.log('\n⚠️ Received SIGHUP, forcing exit...');
    process.exit(0);
  });
}
