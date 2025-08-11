import { assert, executeTestInstruction, initializePage, setupTestContext, teardownTestContext, TestContext } from './test-helper';

/**
 * Streamlined test suite for form filling functionality
 */
export class FormFillingTest {
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
   * Complete form filling test covering all functionality
   */
  async testCompleteFormFilling(): Promise<void> {
    const result = await executeTestInstruction(
      this.context.actionEngine,
      'Navigate to http://localhost:3005/forms/post and complete pizza order: name "John Doe", email "john@example.com", select large size, choose pepperoni and mushroom toppings, and add special instructions "Please ring doorbell twice"',
      'Complete Form Filling Test'
    );

    assert(result.success, 'Complete form filling should succeed');
    assert(result.steps.length >= 6, 'Should generate multiple steps for comprehensive form');
    assert(result.steps.some(step => step.step.type === 'navigate'), 'Should include navigation');
    assert(result.steps.some(step => step.step.type === 'type'), 'Should include text input');
    assert(result.steps.some(step => step.step.type === 'click'), 'Should include selection actions');
  }

  /**
   * Run all streamlined form filling tests
   */
  async runAll(): Promise<void> {
    try {
      await this.setup();
      console.log('🧪 Running streamlined form filling test...');

      await this.testCompleteFormFilling();

      console.log('✅ Form filling test passed');
    } catch (error) {
      console.error('❌ Form filling test failed:', error);
      throw error;
    } finally {
      await this.teardown();
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const formFillingTest = new FormFillingTest();
  formFillingTest.runAll().catch(error => {
    console.error('💥 Form filling test execution failed:', error);
    process.exit(1);
  });
}
