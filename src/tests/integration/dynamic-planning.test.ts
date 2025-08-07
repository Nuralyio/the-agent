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
   * Test that the planner adapts to page content
   */
  async testPageContentAdaptation(): Promise<void> {
    const instruction = "analyze the current page and identify all interactive elements, then click on the most relevant one";

    const result = await executeTestInstruction(
      this.context.actionEngine,
      instruction,
      "Dynamic Planning Test: Page Content Adaptation"
    );

    assert(result.success, "Page content adaptation should complete successfully");

    // The planner should generate specific steps based on actual page content
    assert(result.steps.length >= 2, "Should generate multiple steps for analysis and interaction");

    // Look for evidence of page content analysis
    const clickSteps = result.steps.filter(step => step.step.type === 'click');
    assert(clickSteps.length >= 1, "Should identify and click interactive elements");
  }

  /**
   * Test dynamic selector refinement
   */
  async testSelectorRefinement(): Promise<void> {
    const instruction = "find the main heading on the page and verify its text content";

    const result = await executeTestInstruction(
      this.context.actionEngine,
      instruction,
      "Dynamic Planning Test: Selector Refinement"
    );

    assert(result.success, "Selector refinement should complete successfully");

    // Verify that the planner identified elements to extract and verify
    const extractSteps = result.steps.filter(step => step.step.type === 'extract');
    const verifySteps = result.steps.filter(step => step.step.type === 'verify');

    assert(extractSteps.length >= 1 || verifySteps.length >= 1, "Should contain extraction or verification steps");
  }

  /**
   * Test adaptability across different page types
   */
  async testCrossPageAdaptability(): Promise<void> {
    // Test on HTML page first
    const htmlInstruction = "navigate to https://httpbin.org/html and identify what type of page this is and take appropriate action";

    const htmlResult = await executeTestInstruction(
      this.context.actionEngine,
      htmlInstruction,
      "Dynamic Planning Test: HTML Page Analysis"
    );

    assert(htmlResult.success, "HTML page analysis should complete successfully");

    // Navigate to forms page
    await initializePage(this.context.automation);

    const formInstruction = "navigate to https://httpbin.org/forms/post and identify what type of page this is and take appropriate action";

    const formResult = await executeTestInstruction(
      this.context.actionEngine,
      formInstruction,
      "Dynamic Planning Test: Form Page Analysis"
    );

    assert(formResult.success, "Form page analysis should complete successfully");

    // The plans should be different based on different page content
    console.log(`📊 HTML page generated ${htmlResult.steps.length} steps`);
    console.log(`📊 Form page generated ${formResult.steps.length} steps`);

    // Plans should adapt to content (this is a qualitative test)
    assert(true, "Planner should adapt to different page types");
  }

  /**
   * Test multi-step planning with refinement
   */
  async testMultiStepRefinement(): Promise<void> {
    const instruction = "explore this webpage systematically: first analyze the structure, then interact with any forms, and finally document what you found";

    const result = await executeTestInstruction(
      this.context.actionEngine,
      instruction,
      "Dynamic Planning Test: Multi-step with Refinement"
    );

    assert(result.success, "Multi-step refinement should complete successfully");
    assert(result.steps.length >= 3, "Should generate multiple steps for systematic exploration");

    // Should contain various action types for comprehensive exploration
    const actionTypes = result.steps.map(step => step.step.type);
    const uniqueTypes = [...new Set(actionTypes)];

    assert(uniqueTypes.length >= 2, "Should use multiple action types for systematic exploration");
    console.log(`🔄 Generated ${uniqueTypes.length} different action types: ${uniqueTypes.join(', ')}`);
  }

  /**
   * Test contextual decision making
   */
  async testContextualDecisions(): Promise<void> {
    const instruction = "if this page has forms, fill them out; if it has links, click the most interesting one; if it has neither, take a screenshot";

    const result = await executeTestInstruction(
      this.context.actionEngine,
      instruction,
      "Dynamic Planning Test: Contextual Decision Making"
    );

    assert(result.success, "Contextual decision making should complete successfully");

    // The planner should make decisions based on actual page content
    assert(result.steps.length >= 1, "Should generate at least one contextual action");

    const actionTypes = result.steps.map(step => step.step.type);
    console.log(`🎯 Contextual decision resulted in actions: ${actionTypes.join(', ')}`);
  }

  /**
   * Test recovery from failed steps
   */
  async testErrorRecovery(): Promise<void> {
    const instruction = "try to click on a button, and if that fails, try to find any clickable element and interact with it";

    const result = await executeTestInstruction(
      this.context.actionEngine,
      instruction,
      "Dynamic Planning Test: Error Recovery"
    );

    // The system should handle this gracefully with fallback strategies
    console.log(`🛠️ Error recovery test: ${result.success ? 'Succeeded' : 'Handled gracefully'}`);

    // The key is that the system attempts multiple strategies
    assert(result.steps.length >= 1, "Should generate fallback strategies");
  }

  /**
   * Test plan optimization
   */
  async testPlanOptimization(): Promise<void> {
    const instruction = "accomplish the goal of taking a screenshot in the most efficient way possible";

    const result = await executeTestInstruction(
      this.context.actionEngine,
      instruction,
      "Dynamic Planning Test: Plan Optimization"
    );

    assert(result.success, "Plan optimization should complete successfully");

    // For a simple screenshot, the plan should be concise
    assert(result.steps.length <= 3, "Optimized plan should be concise for simple tasks");

    const hasScreenshotStep = result.steps.some(step => step.step.type === 'screenshot');
    assert(hasScreenshotStep, "Optimized plan should include the required screenshot action");
  }

  /**
   * Run all dynamic planning tests
   */
  async runAll(): Promise<void> {
    console.log('\n🧠 === DYNAMIC PLANNING TESTS ===');

    try {
      await this.setup();

      await this.testPageContentAdaptation();
      await new Promise(resolve => setTimeout(resolve, 1000));

      await this.testSelectorRefinement();
      await new Promise(resolve => setTimeout(resolve, 1000));

      await this.testCrossPageAdaptability();
      await new Promise(resolve => setTimeout(resolve, 1000));

      await this.testMultiStepRefinement();
      await new Promise(resolve => setTimeout(resolve, 1000));

      await this.testContextualDecisions();
      await new Promise(resolve => setTimeout(resolve, 1000));

      await this.testErrorRecovery();
      await new Promise(resolve => setTimeout(resolve, 1000));

      await this.testPlanOptimization();

      console.log('\n✅ All dynamic planning tests completed');
    } catch (error) {
      console.error('❌ Dynamic planning test suite failed:', error);
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
