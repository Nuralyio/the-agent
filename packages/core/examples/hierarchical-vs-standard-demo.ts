#!/usr/bin/env node

/**
 * Demonstration of Hierarchical vs Standard Planning
 * 
 * This demonstrates the key differences and benefits of hierarchical planning
 * compared to standard single-level planning.
 */

import { HierarchicalPlanner } from '../src/engine/planning/hierarchical-planner';
import { ActionPlanner } from '../src/engine/planning/action-planner';
import { setupTestContext, teardownTestContext, TestContext } from '../src/tests/integration/test-helper';
import { TaskContext } from '../src/types';

async function demonstrateHierarchicalPlanning() {
  let context: TestContext | null = null;
  
  try {
    console.log('🧠 Hierarchical vs Standard Planning Comparison\n');
    console.log('=' .repeat(80));

    // Setup test context with real AI engine
    console.log('🔧 Setting up test context with real AI engine...');
    context = await setupTestContext();
    
    console.log('✅ AI engine configured and ready\n');

    // Create planners
    const actionPlanner = new ActionPlanner(context.aiEngine);
    const hierarchicalPlanner = new HierarchicalPlanner(context.aiEngine, actionPlanner);

    // Complex test instruction
    const complexInstruction = 'Navigate to https://opensource-demo.orangehrmlive.com/ and create candidate, login if needed';
    
    console.log(`📝 Test Instruction:`);
    console.log(`   "${complexInstruction}"\n`);

    // Test hierarchical planning decision
    const shouldUseHierarchical = await hierarchicalPlanner.shouldUseHierarchicalPlanning(complexInstruction);
    console.log(`🤔 Hierarchical Planning Decision: ${shouldUseHierarchical ? '✅ YES' : '❌ NO'}\n`);

    if (shouldUseHierarchical) {
      const taskContext: TaskContext = {
        id: 'demo-comparison',
        objective: complexInstruction,
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

      console.log('🔄 CREATING PLANS WITH BOTH APPROACHES...\n');

      // 1. Standard Planning Approach
      console.log('📋 STANDARD PLANNING APPROACH:');
      console.log('─'.repeat(50));
      
      const standardStartTime = Date.now();
      const standardPlan = await actionPlanner.createActionPlan(complexInstruction, taskContext);
      const standardPlanningTime = Date.now() - standardStartTime;
      
      console.log(`✅ Standard plan created in ${standardPlanningTime}ms`);
      console.log(`   Total Steps: ${standardPlan.steps.length}`);
      console.log(`   Plan Structure: Single flat list of actions`);
      console.log(`   Steps:`);
      standardPlan.steps.forEach((step, index) => {
        console.log(`     ${index + 1}. ${step.type}: ${step.description}`);
      });
      console.log('');

      // 2. Hierarchical Planning Approach
      console.log('🧠 HIERARCHICAL PLANNING APPROACH:');
      console.log('─'.repeat(50));
      
      const hierarchicalStartTime = Date.now();
      const hierarchicalPlan = await hierarchicalPlanner.createHierarchicalPlan(complexInstruction, taskContext);
      const hierarchicalPlanningTime = Date.now() - hierarchicalStartTime;
      
      console.log(`✅ Hierarchical plan created in ${hierarchicalPlanningTime}ms`);
      console.log(`   Sub-plans: ${hierarchicalPlan.subPlans.length}`);
      console.log(`   Strategy: ${hierarchicalPlan.planningStrategy}`);
      console.log(`   Plan Structure: Organized sub-objectives with focused actions\n`);
      
      let totalHierarchicalSteps = 0;
      hierarchicalPlan.subPlans.forEach((subPlan, index) => {
        console.log(`   📍 Sub-plan ${index + 1}: ${subPlan.objective}`);
        console.log(`   ├─ Steps: ${subPlan.steps.length}`);
        console.log(`   ├─ Priority: ${subPlan.priority}`);
        console.log(`   └─ Actions:`);
        
        totalHierarchicalSteps += subPlan.steps.length;
        
        subPlan.steps.forEach((step, stepIndex) => {
          const isLast = stepIndex === subPlan.steps.length - 1;
          const prefix = isLast ? '      └─' : '      ├─';
          console.log(`${prefix} ${step.type}: ${step.description}`);
        });
        console.log('');
      });

      // Comparison Summary
      console.log('📊 COMPARISON SUMMARY:');
      console.log('═'.repeat(50));
      console.log(`Planning Time:`);
      console.log(`   Standard: ${standardPlanningTime}ms`);
      console.log(`   Hierarchical: ${hierarchicalPlanningTime}ms (+${hierarchicalPlanningTime - standardPlanningTime}ms)`);
      console.log(`\nStep Organization:`);
      console.log(`   Standard: ${standardPlan.steps.length} steps in flat list`);
      console.log(`   Hierarchical: ${totalHierarchicalSteps} steps across ${hierarchicalPlan.subPlans.length} logical groups`);
      console.log(`\nStructure Benefits:`);
      console.log(`   ✅ Standard: Simple, direct execution`);
      console.log(`   ✅ Hierarchical: Better error recovery, clearer objectives, modular execution`);
      console.log(`\nUse Cases:`);
      console.log(`   📝 Standard: Simple, single-objective tasks`);
      console.log(`   🧠 Hierarchical: Complex, multi-step workflows with dependencies`);

      console.log(`\n🎯 KEY HIERARCHICAL PLANNING BENEFITS:`);
      console.log(`   1. ✅ Logical breakdown of complex tasks`);
      console.log(`   2. ✅ Better error handling per sub-objective`);
      console.log(`   3. ✅ Improved debugging and monitoring`);
      console.log(`   4. ✅ Modular execution with clear progress tracking`);
      console.log(`   5. ✅ Context-aware planning for each sub-task`);
      console.log(`   6. ✅ Ability to retry or skip specific sub-objectives`);

    } else {
      console.log(`📝 This instruction would use standard planning - not complex enough for hierarchical approach.`);
    }

  } catch (error) {
    console.error(`❌ Demonstration failed:`, error instanceof Error ? error.message : error);
  } finally {
    // Cleanup
    if (context) {
      console.log(`\n🧹 Cleaning up test context...`);
      await teardownTestContext(context);
    }
  }
}

// Run the demonstration
if (require.main === module) {
  demonstrateHierarchicalPlanning().catch(error => {
    console.error('💥 Hierarchical planning demonstration failed:', error);
    process.exit(1);
  });
}

export { demonstrateHierarchicalPlanning };
