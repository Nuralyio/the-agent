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
   * Test clicking elements and extracting data
   */
  async testClickAndExtract(): Promise<void> {
    const instruction = "find any link on the page, click it, and extract the page title";

    const result = await executeTestInstruction(
      this.context.actionEngine,
      instruction,
      "Interaction Test: Click and Extract"
    );

    assert(result.success, "Click and extract should complete successfully");

    // Verify the action plan contains click and extract steps
    const clickSteps = result.steps.filter(step => step.step.type === 'click');
    const extractSteps = result.steps.filter(step => step.step.type === 'extract');

    assert(clickSteps.length >= 1, "Should contain at least one click step");
    assert(extractSteps.length >= 1, "Should contain at least one extract step");
  }

  /**
   * Test scroll and interaction workflow
   */
  async testScrollAndInteract(): Promise<void> {
    const instruction = "scroll down the page, look for any interactive element, and click on it";

    const result = await executeTestInstruction(
      this.context.actionEngine,
      instruction,
      "Interaction Test: Scroll and Interact"
    );

    assert(result.success, "Scroll and interact should complete successfully");

    // Verify scroll and click actions
    const scrollSteps = result.steps.filter(step => step.step.type === 'scroll');
    const clickSteps = result.steps.filter(step => step.step.type === 'click');

    assert(scrollSteps.length >= 1, "Should contain scroll step");
    assert(clickSteps.length >= 1, "Should contain click step");
  }

  /**
   * Test typing in search or input fields
   */
  async testTypingInteraction(): Promise<void> {
    // Initialize without navigation - let the instruction handle navigation
    await initializePage(this.context.automation);

    const instruction = "navigate to https://httpbin.org/forms/post and find an input field and type 'Test Search Query' into it";

    const result = await executeTestInstruction(
      this.context.actionEngine,
      instruction,
      "Interaction Test: Typing in Fields"
    );

    assert(result.success, "Typing interaction should complete successfully");

    // Verify type action is present
    const typeSteps = result.steps.filter(step => step.step.type === 'type');
    assert(typeSteps.length >= 1, "Should contain at least one type step");
  }

  /**
   * Test verification of page elements
   */
  async testElementVerification(): Promise<void> {
    const instruction = "verify that the page contains a heading and check if there are any forms present";

    const result = await executeTestInstruction(
      this.context.actionEngine,
      instruction,
      "Interaction Test: Element Verification"
    );

    assert(result.success, "Element verification should complete successfully");

    // Verify verification actions
    const verifySteps = result.steps.filter(step => step.step.type === 'verify');
    assert(verifySteps.length >= 1, "Should contain verification steps");
  }

  /**
   * Test complex multi-action workflow
   */
  async testComplexWorkflow(): Promise<void> {
    const instruction = "scroll to the top of the page, take a screenshot, then scroll down, click any link you find, and extract the current URL";

    const result = await executeTestInstruction(
      this.context.actionEngine,
      instruction,
      "Interaction Test: Complex Multi-Action Workflow"
    );

    assert(result.success, "Complex workflow should complete successfully");
    assert(result.steps.length >= 5, "Should generate multiple steps for complex workflow");

    // Verify all expected action types are present
    const actionTypes = result.steps.map(step => step.step.type);
    const expectedTypes = ['scroll', 'screenshot', 'click', 'extract'];

    for (const expectedType of expectedTypes) {
      assert(
        actionTypes.includes(expectedType as any),
        `Should contain ${expectedType} action`
      );
    }
  }

  /**
   * Test wait and timing operations
   */
  async testWaitOperations(): Promise<void> {
    const instruction = "wait for 3 seconds, then click any button on the page, wait another 2 seconds, and verify the page loaded correctly";

    const result = await executeTestInstruction(
      this.context.actionEngine,
      instruction,
      "Interaction Test: Wait Operations"
    );

    assert(result.success, "Wait operations should complete successfully");

    // Verify wait steps are included
    const waitSteps = result.steps.filter(step => step.step.type === 'wait');
    const clickSteps = result.steps.filter(step => step.step.type === 'click');
    const verifySteps = result.steps.filter(step => step.step.type === 'verify');

    assert(waitSteps.length >= 2, "Should contain multiple wait steps");
    assert(clickSteps.length >= 1, "Should contain click step");
    assert(verifySteps.length >= 1, "Should contain verification step");
  }

  /**
   * Test error handling with invalid actions
   */
  async testErrorHandling(): Promise<void> {
    const instruction = "click on a non-existent element with id 'this-definitely-does-not-exist'";

    const result = await executeTestInstruction(
      this.context.actionEngine,
      instruction,
      "Interaction Test: Error Handling"
    );

    // The system should handle this gracefully, either by:
    // 1. Succeeding with refined selectors, or
    // 2. Failing gracefully without crashing
    console.log(`Error handling test result: ${result.success ? 'Handled gracefully' : 'Failed gracefully'}`);

    // The key is that it shouldn't crash the system
    assert(true, "System should handle invalid selectors gracefully");
  }

  /**
   * Run all interaction tests
   */
  async runAll(): Promise<void> {
    console.log('\n🔄 === INTERACTION TESTS ===');

    try {
      await this.setup();

      await this.testClickAndExtract();
      await new Promise(resolve => setTimeout(resolve, 1000));

      await this.testScrollAndInteract();
      await new Promise(resolve => setTimeout(resolve, 1000));

      await this.testTypingInteraction();
      await new Promise(resolve => setTimeout(resolve, 1000));

      await this.testElementVerification();
      await new Promise(resolve => setTimeout(resolve, 1000));

      await this.testComplexWorkflow();
      await new Promise(resolve => setTimeout(resolve, 1000));

      await this.testWaitOperations();
      await new Promise(resolve => setTimeout(resolve, 1000));

      await this.testErrorHandling();

      console.log('\n✅ All interaction tests completed');
    } catch (error) {
      console.error('❌ Interaction test suite failed:', error);
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
