import { assert, executeTestInstruction, initializePage, setupTestContext, teardownTestContext, TestContext } from './test-helper';

/**
 * Test suite for complex browser interactions
 */
export class InteractionTest {
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
   * Complete interaction test covering all browser interaction functionality
   */
  async testCompleteInteraction(): Promise<void> {
    const result = await executeTestInstruction(
      this.context.actionEngine,
      'Navigate to http://localhost:3005/html, take a screenshot, and scroll down the page',
      'Complete Interaction Test'
    );

    // Allow for partial success since AI behavior can vary
    const successRate = result.steps.filter(step => step.success).length / result.steps.length;
    assert(successRate >= 0.6, `Should have at least 60% success rate, got ${(successRate * 100).toFixed(1)}%`);
    assert(result.steps.length >= 2, 'Should generate multiple steps for comprehensive interaction');
    assert(result.steps.some(step => step.step.type === 'navigate'), 'Should include navigation');
    assert(result.steps.some(step => step.step.type === 'screenshot'), 'Should include screenshot action');
  }

  /**
   * Run all interaction tests
   */
  async runAll(): Promise<void> {
    console.log('\n🔄 === INTERACTION TESTS ===');

    try {
      await this.setup();
      console.log('🧪 Running streamlined interaction test...');

      await this.testCompleteInteraction();

      console.log('\n✅ Interaction test passed');
    } catch (error) {
      console.error('❌ Interaction test failed:', error);
      throw error;
    } finally {
      await this.teardown();
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const interactionTest = new InteractionTest();
  interactionTest.runAll().catch(error => {
    console.error('💥 Interaction test execution failed:', error);
    process.exit(1);
  });
}
