import { setupTestContext, teardownTestContext, TestContext } from './test-helper';

/**
 * Test the AI-driven navigation detection
 */
export class NavigationDetectionTest {
  private context!: TestContext;

  async setup(): Promise<void> {
    this.context = await setupTestContext();
  }

  async teardown(): Promise<void> {
    if (this.context) {
      await teardownTestContext(this.context);
    }
  }

  /**
   * Test navigation detection with various instructions
   */
  async testNavigationDetection(): Promise<void> {
    console.log('\n🧪 Testing AI-driven navigation detection...');

    const testCases = [
      {
        instruction: "Navigate to https://google.com and search for cats",
        expectedNavigation: true,
        description: "URL with navigation verb"
      },
      {
        instruction: "Click the login button and enter credentials",
        expectedNavigation: false,
        description: "Page interaction only"
      },
      {
        instruction: "Go to stackoverflow.com and find javascript tutorials",
        expectedNavigation: true,
        description: "Domain with navigation verb"
      },
      {
        instruction: "Extract the text from the current page",
        expectedNavigation: false,
        description: "Content extraction only"
      },
      {
        instruction: "Visit the OrangeHRM demo site and login",
        expectedNavigation: true,
        description: "Site mention with navigation verb"
      }
    ];

    let passedTests = 0;
    let totalTests = testCases.length;

    for (const testCase of testCases) {
      try {
        console.log(`\n📋 Testing: "${testCase.instruction}"`);
        console.log(`   Expected: ${testCase.expectedNavigation ? 'Navigation Required' : 'No Navigation'}`);
        
        const result = await this.context.actionEngine.checkNavigationRequired(testCase.instruction);
        
        if (result === testCase.expectedNavigation) {
          console.log(`   ✅ PASS: Correctly detected ${result ? 'navigation required' : 'no navigation'}`);
          passedTests++;
        } else {
          console.log(`   ❌ FAIL: Expected ${testCase.expectedNavigation}, got ${result}`);
        }
      } catch (error) {
        console.log(`   ❌ ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`\n📊 Navigation Detection Test Results: ${passedTests}/${totalTests} passed (${((passedTests/totalTests)*100).toFixed(1)}%)`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All navigation detection tests passed!');
    } else {
      console.log('⚠️ Some navigation detection tests failed');
    }
  }

  /**
   * Run all navigation detection tests
   */
  async runAll(): Promise<void> {
    console.log('\n🔄 === NAVIGATION DETECTION TESTS ===');

    try {
      await this.setup();
      await this.testNavigationDetection();
      console.log('\n✅ All navigation detection tests completed');
    } catch (error) {
      console.error('\n❌ Navigation detection test execution failed:', error);
      throw error;
    } finally {
      await this.teardown();
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const navigationTest = new NavigationDetectionTest();
  navigationTest.runAll().catch(error => {
    console.error('💥 Navigation detection test execution failed:', error);
    process.exit(1);
  });
}
