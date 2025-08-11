import { assert, executeTestInstruction, initializePage, setupTestContext, teardownTestContext, TestContext } from './test-helper';

/**
 * Test suite for dynamic planning and AI-driven adaptation
 */
export class DynamicPlanningTest {
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
   * Complete dynamic planning test covering AI-driven adaptation and planning
   */
  async testCompleteDynamicPlanning(): Promise<void> {
    const result = await executeTestInstruction(
      this.context.actionEngine,
      'Navigate to http://localhost:3005/html, analyze the page content, take a screenshot, then navigate to http://localhost:3005/forms/post and take another screenshot to compare different page types',
      'Complete Dynamic Planning Test'
    );

    // Allow for partial success since AI planning can vary
    const successRate = result.steps.filter(step => step.success).length / result.steps.length;
    assert(successRate >= 0.7, `Should have at least 70% success rate for dynamic planning, got ${(successRate * 100).toFixed(1)}%`);
    assert(result.steps.length >= 3, 'Should generate multiple steps for comprehensive planning');
    assert(result.steps.some(step => step.step.type === 'navigate'), 'Should include navigation steps');
    assert(result.steps.some(step => step.step.type === 'screenshot'), 'Should include screenshot actions');
    
    console.log(`🧠 Dynamic planning generated ${result.steps.length} steps with ${(successRate * 100).toFixed(1)}% success rate`);
  }

  /**
   * Run all dynamic planning tests
   */
  async runAll(): Promise<void> {
    console.log('\n🧠 === DYNAMIC PLANNING TESTS ===');

    try {
      await this.setup();
      console.log('🧪 Running streamlined dynamic planning test...');

      await this.testCompleteDynamicPlanning();

      console.log('\n✅ Dynamic planning test passed');
    } catch (error) {
      console.error('❌ Dynamic planning test failed:', error);
      throw error;
    } finally {
      await this.teardown();
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const dynamicPlanningTest = new DynamicPlanningTest();
  dynamicPlanningTest.runAll().catch(error => {
    console.error('💥 Dynamic planning test execution failed:', error);
    process.exit(1);
  });
}
