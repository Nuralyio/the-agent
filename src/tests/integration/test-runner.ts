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
}

// CLI interface when run directly
if (require.main === module) {
  const runner = new TestRunner();
  const args = process.argv.slice(2);

  async function main() {
    try {
      if (args.length === 0) {
        // Run all tests
        await runner.runAll();
      } else if (args[0] === '--list') {
        // List available suites
        runner.listSuites();
      } else if (args[0] === '--configure') {
        // Configure which suites to run
        console.log('🔧 Use runner.configure({ "suite-name": true/false }) in code');
      } else {
        // Run specific suites
        await runner.runSpecific(args);
      }
    } catch (error) {
      console.error('💥 Test runner failed:', error);
      process.exit(1);
    }
  }

  main();
}
