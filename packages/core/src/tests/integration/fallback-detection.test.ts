import { setupTestContext, teardownTestContext, TestContext } from './test-helper';

/**
 * Test the enhanced fallback navigation detection logic
 */
export class FallbackDetectionTest {
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
   * Test fallback detection by simulating AI failures
   */
  async testFallbackDetection(): Promise<void> {
    console.log('\n🧪 Testing enhanced fallback navigation detection...');

    const testCases = [
      // Explicit URLs (should detect)
      { instruction: "Go to https://example.com", expected: true, category: "Explicit URL" },
      { instruction: "Check out www.google.com", expected: true, category: "www URL" },
      { instruction: "Visit stackoverflow.com/questions", expected: true, category: "Domain with path" },
      
      // Domains with navigation context (should detect)
      { instruction: "Navigate to github.com", expected: true, category: "Domain + navigation verb" },
      { instruction: "Open youtube.com and watch videos", expected: true, category: "Domain + action verb" },
      { instruction: "Head to amazon.com", expected: true, category: "Domain + direction verb" },
      
      // Known sites with context (should detect)
      { instruction: "Go to Google and search", expected: true, category: "Known site + navigation" },
      { instruction: "Visit the OrangeHRM demo", expected: true, category: "Known service + visit" },
      { instruction: "Check LinkedIn for updates", expected: true, category: "Known site + check" },
      
      // Strong navigation patterns (should detect)
      { instruction: "Navigate to the company website", expected: true, category: "Navigate to target" },
      { instruction: "Browse to the admin dashboard", expected: true, category: "Browse to admin area" },
      { instruction: "Load up the external dashboard", expected: true, category: "Load external target" },
      
      // Page interactions (should NOT detect)
      { instruction: "Click the login button", expected: false, category: "Button interaction" },
      { instruction: "Fill out the form on the current page", expected: false, category: "Form interaction" },
      { instruction: "Extract text from this page", expected: false, category: "Content extraction" },
      { instruction: "Scroll down and find the footer", expected: false, category: "Page navigation" },
      { instruction: "Type in the search field", expected: false, category: "Input interaction" },
      
      // Edge cases
      { instruction: "Check the email field validation", expected: false, category: "Field mention (not domain)" },
      { instruction: "Go to the next section", expected: false, category: "Page section navigation" },
      { instruction: "Visit the settings tab", expected: false, category: "Tab navigation" },
      { instruction: "Open the file dialog", expected: false, category: "UI dialog" },
      
      // Ambiguous cases (should default to false)
      { instruction: "Find information about the company", expected: false, category: "General search" },
      { instruction: "Look for the contact details", expected: false, category: "Content search" },
    ];

    let passedTests = 0;
    let totalTests = testCases.length;

    for (const testCase of testCases) {
      try {
        console.log(`\n📋 Testing: "${testCase.instruction}"`);
        console.log(`   Category: ${testCase.category}`);
        console.log(`   Expected: ${testCase.expected ? 'Navigation Required' : 'No Navigation'}`);
        
        // Force fallback by using the private method directly
        // We'll access it through the navigation handler instance
        const navigationHandler = (this.context.actionEngine as any).navigationHandler;
        const result = (navigationHandler as any).fallbackNavigationDetection(testCase.instruction);
        
        if (result === testCase.expected) {
          console.log(`   ✅ PASS: Correctly detected ${result ? 'navigation required' : 'no navigation'}`);
          passedTests++;
        } else {
          console.log(`   ❌ FAIL: Expected ${testCase.expected}, got ${result}`);
        }
      } catch (error) {
        console.log(`   ❌ ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`\n📊 Fallback Detection Test Results: ${passedTests}/${totalTests} passed (${((passedTests/totalTests)*100).toFixed(1)}%)`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All fallback detection tests passed!');
    } else {
      console.log('⚠️ Some fallback detection tests failed');
    }
  }

  /**
   * Run all fallback detection tests
   */
  async runAll(): Promise<void> {
    console.log('\n🔄 === ENHANCED FALLBACK DETECTION TESTS ===');

    try {
      await this.setup();
      await this.testFallbackDetection();
      console.log('\n✅ All fallback detection tests completed');
    } catch (error) {
      console.error('\n❌ Fallback detection test execution failed:', error);
      throw error;
    } finally {
      await this.teardown();
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const fallbackTest = new FallbackDetectionTest();
  fallbackTest.runAll().catch(error => {
    console.error('💥 Fallback detection test execution failed:', error);
    process.exit(1);
  });
}
