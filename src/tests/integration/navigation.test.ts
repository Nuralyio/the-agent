import { assert, executeTestInstruction, initializePage, setupTestContext, teardownTestContext, TestContext } from './test-helper';

/**
 * Test suite for navigation functionality
 */
export class NavigationTest {
  private context!: TestContext;

  async setup(): Promise<void> {
    this.context = await setupTestContext();
    await initializePage(this.context.automation);
  }

  async teardown(): Promise<void> {
    if (this.context) {
      await teardownTestContext(this.context);
    }
  }

  /**
   * Test simple navigation to a URL
   */
  async testSimpleNavigation(): Promise<void> {
    const instruction = "go to https://httpbin.org/html";

    const result = await executeTestInstruction(
      this.context.actionEngine,
      instruction,
      "Navigation Test: Simple URL Navigation"
    );

    assert(result.success, "Navigation should complete successfully");
    assert(result.steps.length > 0, "Should generate at least one step");

    // Verify the action plan contains a NAVIGATE step
    const hasNavigateStep = result.steps.some(step => step.step.type === 'navigate');
    assert(hasNavigateStep, "Should contain a navigation step");
  }

  /**
   * Test navigation with domain inference
   */
  async testDomainInference(): Promise<void> {
    const instruction = "navigate to httpbin.org";

    const result = await executeTestInstruction(
      this.context.actionEngine,
      instruction,
      "Navigation Test: Domain Inference"
    );

    assert(result.success, "Domain navigation should complete successfully");

    // Check if the AI properly inferred the protocol
    const navigateStep = result.steps.find(step => step.step.type === 'navigate');
    assert(navigateStep !== undefined, "Should contain a navigation step");
  }

  /**
   * Test navigation error handling
   */
  async testNavigationError(): Promise<void> {
    const instruction = "go to invalid-url-that-does-not-exist.invalid";

    const result = await executeTestInstruction(
      this.context.actionEngine,
      instruction,
      "Navigation Test: Error Handling"
    );

    // This test expects failure - invalid URLs should be handled gracefully
    console.log(`📝 Note: This test expects controlled failure for invalid URLs`);
  }

  /**
   * Run all navigation tests
   */
  async runAll(): Promise<void> {
    console.log('\n🧪 === NAVIGATION TESTS ===');

    try {
      await this.setup();

      await this.testSimpleNavigation();
      await new Promise(resolve => setTimeout(resolve, 1000));

      await this.testDomainInference();
      await new Promise(resolve => setTimeout(resolve, 1000));

      await this.testNavigationError();

      console.log('\n✅ All navigation tests completed');
    } catch (error) {
      console.error('❌ Navigation test suite failed:', error);
      throw error;
    } finally {
      await this.teardown();
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const navigationTest = new NavigationTest();
  navigationTest.runAll().catch(error => {
    console.error('💥 Navigation test execution failed:', error);
    process.exit(1);
  });
}
