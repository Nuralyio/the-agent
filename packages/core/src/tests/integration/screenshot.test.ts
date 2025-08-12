import * as fs from 'fs';
import * as path from 'path';
import { assert, executeTestInstruction, initializePage, setupTestContext, teardownTestContext, TestContext } from './test-helper';

/**
 * Test suite for screenshot functionality
 */
export class ScreenshotTest {
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
   * Test basic screenshot functionality
   */
  async testBasicScreenshot(): Promise<void> {
    const instruction = "take a screenshot";

    const result = await executeTestInstruction(
      this.context.actionEngine,
      instruction,
      "Screenshot Test: Basic Screenshot"
    );

    assert(result.success, "Screenshot should complete successfully");

    // Verify the action plan contains a SCREENSHOT step
    const hasScreenshotStep = result.steps.some(step => step.step.type === 'screenshot');
    assert(hasScreenshotStep, "Should contain a screenshot step");
  }

  /**
   * Test screenshot with custom filename
   */
  async testScreenshotWithFilename(): Promise<void> {
    const testFilename = 'test-screenshot.png';
    const instruction = `take a screenshot and save it as ${testFilename}`;

    const result = await executeTestInstruction(
      this.context.actionEngine,
      instruction,
      "Screenshot Test: Custom Filename"
    );

    assert(result.success, "Screenshot with filename should complete successfully");

    // Check if file was created
    const screenshotPath = path.resolve(testFilename);
    if (fs.existsSync(screenshotPath)) {
      console.log(`✅ Screenshot file created: ${screenshotPath}`);
      // Clean up test file
      fs.unlinkSync(screenshotPath);
      console.log(`🧹 Cleaned up test screenshot file`);
    }
  }

  /**
   * Test screenshot with scroll combination
   */
  async testScreenshotWithScroll(): Promise<void> {
    const instruction = "take a screenshot and then scroll down the page";

    const result = await executeTestInstruction(
      this.context.actionEngine,
      instruction,
      "Screenshot Test: Screenshot + Scroll Combination"
    );

    assert(result.success, "Screenshot and scroll should complete successfully");
    assert(result.steps.length >= 2, "Should generate at least two steps");

    // Verify both actions are present
    const hasScreenshotStep = result.steps.some(step => step.step.type === 'screenshot');
    const hasScrollStep = result.steps.some(step => step.step.type === 'scroll');

    assert(hasScreenshotStep, "Should contain a screenshot step");
    assert(hasScrollStep, "Should contain a scroll step");
  }

  /**
   * Test wait then screenshot workflow
   */
  async testWaitThenScreenshot(): Promise<void> {
    const instruction = "wait for 2 seconds then take another screenshot";

    const result = await executeTestInstruction(
      this.context.actionEngine,
      instruction,
      "Screenshot Test: Wait + Screenshot Workflow"
    );

    assert(result.success, "Wait then screenshot should complete successfully");

    // Verify both actions are present
    const hasWaitStep = result.steps.some(step => step.step.type === 'wait');
    const hasScreenshotStep = result.steps.some(step => step.step.type === 'screenshot');

    assert(hasWaitStep, "Should contain a wait step");
    assert(hasScreenshotStep, "Should contain a screenshot step");
  }

  /**
   * Run all screenshot tests
   */
  async runAll(): Promise<void> {
    console.log('\n🧪 === SCREENSHOT TESTS ===');

    try {
      await this.setup();

      await this.testBasicScreenshot();
      await new Promise(resolve => setTimeout(resolve, 100));

      await this.testScreenshotWithFilename();
      await new Promise(resolve => setTimeout(resolve, 100));

      await this.testScreenshotWithScroll();
      await new Promise(resolve => setTimeout(resolve, 100));

      await this.testWaitThenScreenshot();

      console.log('\n✅ All screenshot tests completed');
    } catch (error) {
      console.error('❌ Screenshot test suite failed:', error);
      throw error;
    } finally {
      await this.teardown();
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const screenshotTest = new ScreenshotTest();
  screenshotTest.runAll().catch(error => {
    console.error('💥 Screenshot test execution failed:', error);
    process.exit(1);
  });
}
