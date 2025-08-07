import { assert, executeTestInstruction, initializePage, setupTestContext, teardownTestContext, TestContext } from './test-helper';

/**
 * Test suite for form filling functionality
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
   * Test simple form filling
   */
  async testSimpleFormFill(): Promise<void> {
    const instruction = "Navigate to https://httpbin.org/forms/post and type 'John Doe' into the customer name field and type 'john@example.com' into the email address field";

    const result = await executeTestInstruction(
      this.context.actionEngine,
      instruction,
      "Form Filling Test: Simple Form Fill"
    );

    assert(result.success, "Form filling should complete successfully");

    // Verify the action plan contains navigation and TYPE steps
    const navigateSteps = result.steps.filter(step => step.step.type === 'navigate');
    const typeSteps = result.steps.filter(step => step.step.type === 'type');
    assert(navigateSteps.length >= 1, "Should contain navigation step");
    assert(typeSteps.length >= 2, "Should contain at least two type steps for name and email");
  }

  /**
   * Test comprehensive form filling - fill all fields dynamically
   */
  async testComprehensiveFormFill(): Promise<void> {
    console.log('📋 Form Filling Test: Comprehensive Form Fill');

    // Test with navigation included in the instruction
    const result = await executeTestInstruction(
      this.context.actionEngine,
      'Navigate to https://httpbin.org/forms/post then type "Jane Smith" in customer name field, type "555-123-4567" in phone field, type "jane@email.com" in email field',
      'Form Filling Test: Comprehensive Form Fill'
    );

    assert(result.success, 'Comprehensive form filling should complete successfully');

    // Verify multiple steps were generated for navigation and different field types
    assert(result.steps.length >= 4, 'Should generate multiple steps for navigation and comprehensive form');

    // Check for navigation and type action types
    const hasNavigateSteps = result.steps.some((step: any) => step.step.type === 'navigate');
    const hasTypeSteps = result.steps.some((step: any) => step.step.type === 'type');

    assert(hasNavigateSteps, 'Should include NAVIGATE action');
    assert(hasTypeSteps, 'Should include TYPE actions for text fields');
  }  /**
   * Test dynamic form discovery and analysis
   */
  async testDynamicFormDiscovery(): Promise<void> {
    console.log('📋 Form Filling Test: Dynamic Form Discovery');

    // Test AI's ability to analyze form structure and identify all available fields
    const result = await executeTestInstruction(
      this.context.actionEngine,
      'Navigate to https://httpbin.org/forms/post and fill in the customer name with "Test User" and email with "test@example.com"',
      'Form Filling Test: Dynamic Form Discovery'
    );

    assert(result.success, 'Dynamic form discovery should complete successfully');

    // Verify that the AI included navigation and identified correct selectors for form fields
    const hasNavigateStep = result.steps.some((step: any) => step.step.type === 'navigate');
    const hasNameField = result.steps.some((step: any) =>
      step.step.target?.selector?.includes('custname') && step.step.type === 'type'
    );
    const hasEmailField = result.steps.some((step: any) =>
      step.step.target?.selector?.includes('custemail') && step.step.type === 'type'
    );

    assert(hasNavigateStep, 'Should include navigation step');
    assert(hasNameField, 'Should identify and fill customer name field');
    assert(hasEmailField, 'Should identify and fill customer email field');
  }

  /**
   * Test radio buttons and checkboxes (separate test to isolate issues)
   */
  async testRadioAndCheckboxHandling(): Promise<void> {
    console.log('📋 Form Filling Test: Radio and Checkbox Handling');

    // Test radio button selection
    const radioResult = await executeTestInstruction(
      this.context.actionEngine,
      'Navigate to https://httpbin.org/forms/post and select the medium pizza size',
      'Form Filling Test: Radio Button Click'
    );

    assert(radioResult.success, 'Radio button selection should complete successfully');

    // Verify navigation and radio button click was generated
    const hasNavigateStep = radioResult.steps.some((step: any) => step.step.type === 'navigate');
    const hasRadioClick = radioResult.steps.some((step: any) =>
      step.step.type === 'click' &&
      step.step.target?.selector?.includes('medium')
    );
    assert(hasNavigateStep, 'Should include navigation step');
    assert(hasRadioClick, 'Should generate CLICK action for radio button');

    // Test checkbox selection
    const checkboxResult = await executeTestInstruction(
      this.context.actionEngine,
      'Navigate to https://httpbin.org/forms/post and select bacon and cheese toppings',
      'Form Filling Test: Checkbox Selection'
    );

    assert(checkboxResult.success, 'Checkbox selection should complete successfully');

    // Verify navigation and checkbox clicks were generated
    const hasNavigateStep2 = checkboxResult.steps.some((step: any) => step.step.type === 'navigate');
    const hasCheckboxClicks = checkboxResult.steps.filter((step: any) =>
      step.step.type === 'click' &&
      (step.step.target?.selector?.includes('bacon') || step.step.target?.selector?.includes('cheese'))
    );
    assert(hasNavigateStep2, 'Should include navigation step');
    assert(hasCheckboxClicks.length >= 1, 'Should generate CLICK actions for checkboxes');

    console.log(`✅ Radio button test: ${radioResult.success ? 'Success' : 'Failed'}`);
    console.log(`✅ Checkbox test: ${checkboxResult.success ? 'Success' : 'Failed'}`);
    console.log(`📊 Total steps generated: ${radioResult.steps.length + checkboxResult.steps.length}`);
  }

  /**
   * Test form filling with validation
   */
  async testFormFillWithValidation(): Promise<void> {
    const instruction = "Navigate to https://httpbin.org/forms/post, type 'Jane Smith' into the customer name field, type 'jane@test.com' into the email field, and verify the fields are filled correctly";

    const result = await executeTestInstruction(
      this.context.actionEngine,
      instruction,
      "Form Filling Test: Fill with Validation"
    );

    assert(result.success, "Form filling with validation should complete successfully");

    // Verify different action types are present including navigation
    const navigateSteps = result.steps.filter(step => step.step.type === 'navigate');
    const typeSteps = result.steps.filter(step => step.step.type === 'type');
    const verifySteps = result.steps.filter(step => step.step.type === 'verify' || step.step.type === 'extract');

    assert(navigateSteps.length >= 1, "Should contain navigation step");
    assert(typeSteps.length >= 2, "Should contain type steps");
    assert(verifySteps.length >= 1, "Should contain verification step");
  }

  /**
   * Test form submission workflow
   */
  async testFormSubmission(): Promise<void> {
    const instruction = "Navigate to https://httpbin.org/forms/post, fill the form with name 'Test User' and email 'test@domain.com', then submit it";

    const result = await executeTestInstruction(
      this.context.actionEngine,
      instruction,
      "Form Filling Test: Complete Form Submission"
    );

    assert(result.success, "Form submission workflow should complete successfully");

    // Verify the workflow contains navigation, filling and clicking
    const navigateSteps = result.steps.filter(step => step.step.type === 'navigate');
    const fillSteps = result.steps.filter(step => step.step.type === 'fill');
    const clickSteps = result.steps.filter(step => step.step.type === 'click');

    assert(navigateSteps.length >= 1, "Should contain navigation step");
    assert(fillSteps.length >= 2, "Should contain fill steps");
    assert(clickSteps.length >= 1, "Should contain click step for submission");
  }

  /**
   * Test multi-step form navigation
   */
  async testMultiStepForm(): Promise<void> {
    // Initialize without navigation - let the instruction handle navigation
    await initializePage(this.context.automation);

    const instruction = "navigate to the forms page, fill in customer details with name 'Multi Step User' and email 'multistep@test.com'";

    const result = await executeTestInstruction(
      this.context.actionEngine,
      instruction,
      "Form Filling Test: Multi-step Form Navigation"
    );

    assert(result.success, "Multi-step form process should complete successfully");

    // Verify navigation and form filling
    const navigateSteps = result.steps.filter(step => step.step.type === 'navigate');
    const fillSteps = result.steps.filter(step => step.step.type === 'fill');

    assert(navigateSteps.length >= 1, "Should contain navigation step");
    assert(fillSteps.length >= 2, "Should contain form filling steps");
  }

  /**
   * Test form clearing and refilling
   */
  async testFormClearAndRefill(): Promise<void> {
    const instruction = "Navigate to https://httpbin.org/forms/post, clear the form fields and then fill them with name 'Cleared User' and email 'cleared@example.com'";

    const result = await executeTestInstruction(
      this.context.actionEngine,
      instruction,
      "Form Filling Test: Clear and Refill"
    );

    assert(result.success, "Form clearing and refilling should complete successfully");

    // The plan should contain navigation and multiple fill operations
    const navigateSteps = result.steps.filter(step => step.step.type === 'navigate');
    const fillSteps = result.steps.filter(step => step.step.type === 'fill');
    assert(navigateSteps.length >= 1, "Should contain navigation step");
    assert(fillSteps.length >= 2, "Should contain steps to clear and refill form fields");
  }

  /**
   * Run all form filling tests
   */
  /**
   * Test comprehensive form filling with all element types
   */
  async testFullFormAutomation(): Promise<void> {
    console.log('📋 Form Filling Test: Full Form Automation');

    const result = await executeTestInstruction(
      this.context.actionEngine,
      'Navigate to https://httpbin.org/forms/post and fill out the complete pizza order: customer name "Sarah Johnson", phone "555-987-6543", email "sarah@test.com", select large pizza size, select mushroom and onion toppings, set delivery time to "19:45", and add delivery instructions "Ring doorbell"',
      'Form Filling Test: Complete Form'
    );

    assert(result.success, 'Complete form automation should succeed');

    // Verify all types of actions were generated including navigation
    const navigateSteps = result.steps.filter((step: any) => step.step.type === 'navigate');
    const typeSteps = result.steps.filter((step: any) => step.step.type === 'type' || step.step.type === 'fill');
    const clickSteps = result.steps.filter((step: any) => step.step.type === 'click');

    assert(navigateSteps.length >= 1, 'Should have NAVIGATE step');
    assert(typeSteps.length >= 4, 'Should have TYPE/FILL steps for text fields');
    assert(clickSteps.length >= 1, 'Should have CLICK steps for radio/checkboxes');
    assert(result.steps.length >= 7, 'Should generate comprehensive action plan including navigation');

    console.log(`✅ Full form automation completed with ${result.steps.length} steps`);
    console.log(`📊 NAVIGATE actions: ${navigateSteps.length}, TYPE actions: ${typeSteps.length}, CLICK actions: ${clickSteps.length}`);
  }

  async runAll(): Promise<void> {
    try {
      await this.setup();
      
      await this.testSimpleFormFill();
      await this.testComprehensiveFormFill();
      await this.testDynamicFormDiscovery();
      await this.testRadioAndCheckboxHandling();
      await this.testFullFormAutomation();
      
      console.log('✅ All form filling tests passed');
    } catch (error) {
      console.error('❌ Form filling test suite failed:', error);
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
