import { assert, executeTestInstruction, initializePage, setupTestContext, teardownTestContext, TestContext } from './test-helper';

/**
 * Integration test for OrangeHRM demo site
 * Tests hierarchical planning through ActionEngine (which uses UnifiedPlanner automatically)
 */
export class OrangeHRMLoginTest {
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
   * Test OrangeHRM candidate creation with hierarchical planning
   * Uses ActionEngine which automatically uses UnifiedPlanner with hierarchical planning
   */
  async testOrangeHRMCandidateCreation(): Promise<void> {
    const instruction = "Navigate to https://opensource-demo.orangehrmlive.com/ and create candidate, login if needed";

    const result = await executeTestInstruction(
      this.context.actionEngine,
      instruction,
      "OrangeHRM Test: Candidate Creation"
    );

    assert(result.success, "OrangeHRM candidate creation should complete successfully");
    assert(result.steps.length > 0, "Should generate at least one step");

    // Verify the action plan contains navigation
    const hasNavigateStep = result.steps.some(step => step.step.type === 'navigate');
    assert(hasNavigateStep, "Should contain a navigation step");
  }

  /**
   * Test OrangeHRM login flow with credentials
   */
  async testOrangeHRMLogin(): Promise<void> {
    const instruction = "Navigate to https://opensource-demo.orangehrmlive.com/ and look for the demo username and password credentials that are shown on the page, then use those credentials to actually log in to the system";

    const result = await executeTestInstruction(
      this.context.actionEngine,
      instruction,
      "OrangeHRM Test: Login Flow"
    );

    assert(result.success, "OrangeHRM login should complete successfully");
    assert(result.steps.length > 0, "Should generate multiple steps for login flow");

    // Verify the action plan contains navigation
    const hasNavigateStep = result.steps.some(step => step.step.type === 'navigate');
    assert(hasNavigateStep, "Should contain a navigation step");

    // Verify the action plan contains text input (for credentials)
    const hasTextInputStep = result.steps.some(step => step.step.type === 'type');
    assert(hasTextInputStep, "Should contain text input steps for credentials");
  }

  /**
   * Test OrangeHRM page examination
   */
  async testOrangeHRMPageExamination(): Promise<void> {
    const instruction = "Navigate to https://opensource-demo.orangehrmlive.com/ and examine the login form, take a screenshot, then try to identify the demo credentials shown on the page";

    const result = await executeTestInstruction(
      this.context.actionEngine,
      instruction,
      "OrangeHRM Test: Page Examination"
    );

    assert(result.success, "OrangeHRM page examination should complete successfully");
    assert(result.steps.length > 0, "Should generate steps for page examination");

    // Verify the action plan contains navigation
    const hasNavigateStep = result.steps.some(step => step.step.type === 'navigate');
    assert(hasNavigateStep, "Should contain a navigation step");
  }

  /**
   * Test error handling for external site navigation
   */
  async testErrorHandling(): Promise<void> {
    console.log('\n🧪 Testing error handling scenarios...');

    // Test with a potentially slow-loading page to verify timeout handling
    try {
      const instruction = "Navigate to https://opensource-demo.orangehrmlive.com/ and wait for the page to fully load, then identify any login elements";

      const result = await executeTestInstruction(
        this.context.actionEngine,
        instruction,
        "OrangeHRM Test: Error Handling and Timeout"
      );

      // This test should either succeed or fail gracefully
      console.log(`🔄 Error handling test result: ${result.success ? 'Success' : 'Handled gracefully'}`);

      // If it fails, it should still have attempted navigation
      if (!result.success) {
        const navSteps = result.steps.filter(step => step.step.type === 'navigate');
        assert(navSteps.length >= 1, "Should have attempted navigation even if subsequent steps failed");
      }

    } catch (error) {
      // This is also acceptable - we're testing that errors are handled gracefully
      console.log(`⚠️ Test encountered error (as expected for error handling test): ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Run all OrangeHRM tests
   */
  async runAll(): Promise<void> {
    console.log('\n🔄 === ORANGEHRM TESTS ===');

    try {
      await this.setup();

      console.log('\n🧪 Running OrangeHRM candidate creation test...');
      await this.testOrangeHRMCandidateCreation();
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('\n🧪 Running OrangeHRM login test...');
      await this.testOrangeHRMLogin();
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('\n🧪 Running OrangeHRM page examination test...');
      await this.testOrangeHRMPageExamination();
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('\n🧪 Running error handling test...');
      await this.testErrorHandling();

      console.log('\n✅ All OrangeHRM tests completed');
    } catch (error) {
      console.error('\n❌ OrangeHRM test execution failed:', error);
      throw error;
    } finally {
      await this.teardown();
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const orangeHRMTest = new OrangeHRMLoginTest();
  orangeHRMTest.runAll().catch(error => {
    console.error('💥 OrangeHRM test execution failed:', error);
    process.exit(1);
  });
}
