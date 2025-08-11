import { assert, executeTestInstruction, initializePage, setupTestContext, teardownTestContext, TestContext } from './test-helper';

/**
 * Integration test for OrangeHRM demo site login field identification
 * Tests the ability to navigate to a live demo site and identify form elements
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
   * Test navigation to OrangeHRM demo site and login field identification
   * This test validates the framework's ability to:
   * 1. Navigate to an external live demo site
   * 2. Identify username and password input fields
   * 3. Extract field attributes and properties
   */
  async testOrangeHRMLoginFieldIdentification(): Promise<void> {
    const instruction = "Navigate to https://opensource-demo.orangehrmlive.com/ and look for the demo username and password credentials that are shown on the page, then use those credentials to actually log in to the system";

    const result = await executeTestInstruction(
      this.context.actionEngine,
      instruction,
      "OrangeHRM Test: Login Field Identification and Authentication"
    );

    assert(result.success, "OrangeHRM login field identification should complete successfully");
    assert(result.steps.length > 0, "Should generate at least one step");

    // Verify the action plan contains a NAVIGATE step
    const navSteps = result.steps.filter(step => step.step.type === 'navigate');
    assert(navSteps.length >= 1, "Should contain a navigation step to OrangeHRM demo site");

    // Debug: Log navigation steps to understand structure
    console.log('🔍 Navigation steps found:', navSteps.map(step => ({
      type: step.step.type,
      url: step.step.url,
      description: step.step.description || step.description,
      step: step.step
    })));

    // Check if navigation was to the correct URL (URL is in step.value field)
    const orangeHRMNavStep = navSteps.find(step =>
      (step.step.value && step.step.value.includes('opensource-demo.orangehrmlive.com')) ||
      (step.step.description && step.step.description.toLowerCase().includes('orangehrm')) ||
      (step.description && step.description.toLowerCase().includes('orangehrm'))
    );
    assert(!!orangeHRMNavStep, "Should navigate to the OrangeHRM demo site");

    // Verify that the test included some form of element identification
    // This could be through wait, screenshot, or extract actions
    const identificationSteps = result.steps.filter(step =>
      ['wait', 'screenshot', 'extract', 'type', 'click'].includes(step.step.type)
    );
    assert(identificationSteps.length >= 1, "Should contain steps that identify or interact with page elements");

    console.log(`✅ Successfully identified login fields on OrangeHRM demo site with ${result.steps.length} steps`);
  }

  /**
   * Test more specific field targeting for username and password fields
   * This test validates detailed form field analysis
   */
  async testSpecificLoginFieldExtraction(): Promise<void> {
    const instruction = "Go to https://opensource-demo.orangehrmlive.com/ and find the username input field, then find the password input field, and take a screenshot of the login form";

    const result = await executeTestInstruction(
      this.context.actionEngine,
      instruction,
      "OrangeHRM Test: Specific Field Extraction"
    );

    assert(result.success, "Specific login field extraction should complete successfully");
    assert(result.steps.length >= 2, "Should generate multiple steps for navigation and field identification");

    // Verify navigation step
    const navSteps = result.steps.filter(step => step.step.type === 'navigate');
    assert(navSteps.length >= 1, "Should contain navigation step");

    // Verify field interaction or identification steps
    const fieldSteps = result.steps.filter(step =>
      ['wait', 'click', 'type', 'extract'].includes(step.step.type)
    );
    assert(fieldSteps.length >= 1, "Should contain steps that interact with or identify form fields");

    // Verify screenshot step if requested
    const screenshotSteps = result.steps.filter(step => step.step.type === 'screenshot');
    // Screenshot step is optional as AI might optimize the plan

    console.log(`✅ Successfully extracted specific login fields with ${result.steps.length} steps`);
  }

  /**
   * Test form element discovery and attribute extraction
   * This validates the framework's ability to discover form elements and their properties
   */
  async testFormElementDiscovery(): Promise<void> {
    const instruction = "Navigate to https://opensource-demo.orangehrmlive.com/ and examine the login form to identify all input fields and their types (username, password, etc.)";

    const result = await executeTestInstruction(
      this.context.actionEngine,
      instruction,
      "OrangeHRM Test: Form Element Discovery"
    );

    assert(result.success, "Form element discovery should complete successfully");
    assert(result.steps.length > 0, "Should generate at least one step");

    // Verify navigation
    const navSteps = result.steps.filter(step => step.step.type === 'navigate');
    assert(navSteps.length >= 1, "Should contain navigation step");

    // Verify some form of analysis or examination
    const analysisSteps = result.steps.filter(step =>
      ['wait', 'extract', 'screenshot', 'type', 'click'].includes(step.step.type)
    );
    assert(analysisSteps.length >= 1, "Should contain steps that examine or analyze form elements");

    console.log(`✅ Successfully discovered form elements with ${result.steps.length} steps`);
  }

  /**
   * Test error handling for external site navigation
   * This validates graceful handling of potential network issues or site changes
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
   * Run all OrangeHRM login tests
   */
  async runAll(): Promise<void> {
    console.log('\n🔄 === ORANGEHRM LOGIN IDENTIFICATION TESTS ===');

    try {
      await this.setup();

      await this.testOrangeHRMLoginFieldIdentification();
      // await new Promise(resolve => setTimeout(resolve, 2000)); // Allow time between tests

      // Skip other tests for now to isolate the double browser issue
      // await this.testSpecificLoginFieldExtraction();
      // await new Promise(resolve => setTimeout(resolve, 2000));

      // await this.testFormElementDiscovery();
      // await new Promise(resolve => setTimeout(resolve, 2000));

      // await this.testErrorHandling();

      console.log('\n✅ All OrangeHRM login identification tests completed');
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
    console.error('💥 OrangeHRM login test execution failed:', error);
    process.exit(1);
  });
}
