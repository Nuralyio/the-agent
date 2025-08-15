import { assert, executeTestInstruction, initializePage, setupTestContext, teardownTestContext, TestContext } from './test-helper';
import { Planner } from '../../engine/planning/planner';
import { ActionPlanner } from '../../engine/planning/action-planner';
import { TaskContext, ActionType } from '../../types';

/**
 * Test suite for planning functionality with real AI
 */
export class PlannerTest {
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
   * Test hierarchical planning decision logic
   */
  async testHierarchicalPlanningDecision(): Promise<void> {
    const actionPlanner = new ActionPlanner(this.context.aiEngine);
    const planner = new Planner(this.context.aiEngine);

    // Test cases for hierarchical planning decision
    const testCases = [
      {
        instruction: 'Navigate to https://opensource-demo.orangehrmlive.com/ and create candidate, login if needed',
        expectedHierarchical: true,
        description: 'Complex multi-step workflow'
      },
      {
        instruction: 'Click the submit button',
        expectedHierarchical: false,
        description: 'Simple single action'
      },
      {
        instruction: 'Go to github.com, search for typescript projects, star the first three results, and create a new repository with README',
        expectedHierarchical: true,
        description: 'Multi-objective workflow'
      },
      {
        instruction: 'Fill out the form with test data',
        expectedHierarchical: false,
        description: 'Single objective'
      }
    ];

    let passedTests = 0;

    for (const testCase of testCases) {
      try {
        console.log(`🔍 Testing: "${testCase.instruction.substring(0, 50)}..."`);
        const shouldUseHierarchical = await planner.shouldUseHierarchicalPlanning(testCase.instruction);
        
        if (shouldUseHierarchical === testCase.expectedHierarchical) {
          console.log(`   ✅ PASS: ${shouldUseHierarchical ? 'Hierarchical' : 'Standard'} planning correctly identified`);
          passedTests++;
        } else {
          console.log(`   ❌ FAIL: Expected ${testCase.expectedHierarchical ? 'hierarchical' : 'standard'}, got ${shouldUseHierarchical ? 'hierarchical' : 'standard'}`);
        }
      } catch (error) {
        console.log(`   ❌ ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`📊 Hierarchical Planning Decision Test: ${passedTests}/${testCases.length} passed`);
    assert(passedTests >= testCases.length * 0.75, `Should pass at least 75% of decision tests, got ${passedTests}/${testCases.length}`);
  }

  /**
   * Test hierarchical plan creation with real AI
   */
  async testHierarchicalPlanCreation(): Promise<void> {
    const actionPlanner = new ActionPlanner(this.context.aiEngine);
    const planner = new Planner(this.context.aiEngine);

    const instruction = 'Navigate to https://opensource-demo.orangehrmlive.com/ and create candidate, login if needed';
    
    const taskContext: TaskContext = {
      id: 'test-hierarchical-plan',
      objective: instruction,
      constraints: [],
      variables: {},
      history: [],
      currentState: {
        url: '',
        title: '',
        content: '',
        screenshot: Buffer.alloc(0),
        timestamp: Date.now(),
        viewport: { width: 1280, height: 720 },
        elements: []
      },
      url: '',
      pageTitle: ''
    };

    console.log(`🏗️  Creating plan for complex instruction...`);
    const plan = await planner.planInstruction(instruction, taskContext);

    // Log the plan details for debugging
    console.log(`📋 Generated Plan Details:`);
    console.log(`   Sub-plans: ${plan.subPlans.length}`);
    console.log(`   Strategy: ${plan.planningStrategy}`);
    console.log(`   Objectives:`);
    plan.subPlans.forEach((subPlan: any, index: number) => {
      console.log(`     ${index + 1}. ${subPlan.objective}`);
    });

    // Validate plan structure (more lenient to account for AI variations)
    assert(plan.subPlans.length >= 1, `Should create at least 1 sub-plan, got ${plan.subPlans.length}`);
    assert(plan.planningStrategy === 'sequential' || plan.planningStrategy === 'parallel', `Should have valid strategy, got ${plan.planningStrategy}`);
    assert(plan.totalEstimatedDuration > 0, 'Should have positive estimated duration');

    console.log(`✅ Plan created with ${plan.subPlans.length} sub-plans using ${plan.planningStrategy} strategy`);

    // Validate each sub-plan
    let totalSteps = 0;
    plan.subPlans.forEach((subPlan: any, index: number) => {
      assert(subPlan.objective.length > 0, `Sub-plan ${index + 1} should have objective`);
      assert(subPlan.steps.length > 0, `Sub-plan ${index + 1} should have steps`);
      assert(subPlan.priority >= 1, `Sub-plan ${index + 1} should have valid priority`);
      totalSteps += subPlan.steps.length;
    });

    console.log(`✅ All ${plan.subPlans.length} sub-plans validated with ${totalSteps} total steps`);

    // Validate step types and structure
    const hasNavigationSteps = plan.subPlans.some((subPlan: any) => 
      subPlan.steps.some((step: any) => step.type === ActionType.NAVIGATE)
    );
    assert(hasNavigationSteps, 'Should include navigation steps for this instruction');

    console.log(`✅ Plan includes appropriate action types for the instruction`);
  }

  /**
   * Test sub-plan execution capability
   */
  async testSubPlanExecution(): Promise<void> {
    const actionPlanner = new ActionPlanner(this.context.aiEngine);
    const planner = new Planner(this.context.aiEngine);

    // Create a simple hierarchical plan
    const instruction = 'Navigate to http://localhost:3005/html and take a screenshot';
    
    const taskContext: TaskContext = {
      id: 'test-execution',
      objective: instruction,
      constraints: [],
      variables: {},
      history: [],
      currentState: {
        url: '',
        title: '',
        content: '',
        screenshot: Buffer.alloc(0),
        timestamp: Date.now(),
        viewport: { width: 1280, height: 720 },
        elements: []
      },
      url: '',
      pageTitle: ''
    };

    const plan = await planner.planInstruction(instruction, taskContext);
    console.log(`🚀 Executing plan with ${plan.subPlans.length} sub-plans...`);

    // Create an execution function for the plan
    const executePlan = async (actionPlan: any) => {
      const result = await this.context.actionEngine.executeActionPlan(actionPlan);
      return result;
    };

    const result = await planner.executePlan(plan, executePlan);

    // Validate execution results
    assert(result.success === true || result.results.length > 0, 'Should attempt execution');
    assert(result.results.length > 0, 'Should execute at least one sub-plan');
    
    if (result.hierarchicalPlan) {
      assert(result.hierarchicalPlan.subPlans.length === plan.subPlans.length, 'Should preserve hierarchical plan structure');
    }

    console.log(`✅ Execution completed with ${result.results.length} sub-plans executed`);
    
    // Log execution details
    const successfulSubPlans = result.results.filter((subResult: any) => subResult.success).length;
    console.log(`📊 Sub-plan success rate: ${successfulSubPlans}/${result.results.length} (${((successfulSubPlans/result.results.length)*100).toFixed(1)}%)`);
  }

  /**
   * Run all hierarchical planner tests
   */
  async runAll(): Promise<void> {
    console.log('\n🧠 === HIERARCHICAL PLANNER TESTS ===');
    try {
      await this.setup();
      
      console.log('\n🔍 Testing hierarchical planning decision logic...');
      await this.testHierarchicalPlanningDecision();
      
      console.log('\n🏗️  Testing hierarchical plan creation...');
      await this.testHierarchicalPlanCreation();
      
      console.log('\n🚀 Testing sub-plan execution...');
      await this.testSubPlanExecution();
      
      console.log('\n✅ All hierarchical planner tests completed successfully');
    } catch (error) {
      console.error('❌ Hierarchical planner tests failed:', error);
      throw error;
    } finally {
      await this.teardown();
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const plannerTest = new PlannerTest();
  plannerTest.runAll().catch(error => {
    console.error('💥 Hierarchical planner test execution failed:', error);
    process.exit(1);
  });
}
