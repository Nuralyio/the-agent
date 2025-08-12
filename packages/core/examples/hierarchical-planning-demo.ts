#!/usr/bin/env node

/**
 * Example demonstration of hierarchical planning
 * 
 * This example shows how the hierarchical planner breaks down complex instructions
 * into logical sub-objectives and creates detailed action plans for each.
 */

import { HierarchicalPlanner } from '../src/engine/planning/hierarchical-planner';
import { ActionPlanner } from '../src/engine/planning/action-planner';
import { AIEngine } from '../src/ai/ai-engine';
import { TaskContext } from '../src/types';

// Mock AI Engine for demonstration
class MockAIEngine {
  async generateText(prompt: string, systemPrompt?: string): Promise<{ content: string }> {
    // Simulate different responses based on prompt content
    if (prompt.includes('Break down this complex instruction')) {
      // Global planning response
      return {
        content: JSON.stringify({
          subObjectives: [
            'Navigate to https://opensource-demo.orangehrmlive.com/',
            'Login to the system if authentication is required', 
            'Navigate to the candidate management section',
            'Find the option to add/create a new candidate',
            'Fill out the candidate creation form with required information',
            'Submit the form and verify successful candidate creation'
          ],
          planningStrategy: 'sequential',
          reasoning: 'Multi-step workflow requiring navigation, potential authentication, section navigation, form interaction, and verification'
        })
      };
    } else {
      // Sub-plan action planning response
      const subObjective = prompt.match(/Instruction: "([^"]+)"/)?.[1] || '';
      
      if (subObjective.includes('Navigate to https://opensource-demo.orangehrmlive.com/')) {
        return {
          content: JSON.stringify({
            steps: [
              {
                type: 'NAVIGATE',
                description: 'Navigate to OrangeHRM demo website',
                target: { url: 'https://opensource-demo.orangehrmlive.com/' }
              },
              {
                type: 'WAIT',
                description: 'Wait for page to load completely',
                timeout: 5000
              }
            ],
            reasoning: 'Navigation to target website with wait for page load'
          })
        };
      } else if (subObjective.includes('Login to the system')) {
        return {
          content: JSON.stringify({
            steps: [
              {
                type: 'CLICK',
                description: 'Look for and click login button or field',
                target: { 
                  selector: 'input[name="username"], #username, .login-username',
                  description: 'Username input field'
                }
              },
              {
                type: 'TYPE',
                description: 'Enter username',
                target: { selector: 'input[name="username"]' },
                value: 'Admin'
              },
              {
                type: 'TYPE', 
                description: 'Enter password',
                target: { selector: 'input[name="password"]' },
                value: 'admin123'
              },
              {
                type: 'CLICK',
                description: 'Click login submit button',
                target: { 
                  selector: 'button[type="submit"], .login-button',
                  description: 'Login submit button'
                }
              }
            ],
            reasoning: 'Standard login form interaction with username and password'
          })
        };
      } else if (subObjective.includes('candidate management')) {
        return {
          content: JSON.stringify({
            steps: [
              {
                type: 'CLICK',
                description: 'Click on Recruitment menu',
                target: { 
                  selector: 'a[href*="recruitment"], .menu-recruitment',
                  description: 'Recruitment menu item'
                }
              },
              {
                type: 'CLICK',
                description: 'Click on Candidates submenu',
                target: { 
                  selector: 'a[href*="candidates"], .submenu-candidates',
                  description: 'Candidates submenu'
                }
              }
            ],
            reasoning: 'Navigation to recruitment section and candidates management'
          })
        };
      } else if (subObjective.includes('add/create a new candidate')) {
        return {
          content: JSON.stringify({
            steps: [
              {
                type: 'CLICK',
                description: 'Look for Add Candidate button',
                target: { 
                  selector: '.add-button, button[contains(text(), "Add")], .btn-add',
                  description: 'Add candidate button'
                }
              }
            ],
            reasoning: 'Find and click the add candidate button to start creation process'
          })
        };
      } else if (subObjective.includes('Fill out the candidate creation form')) {
        return {
          content: JSON.stringify({
            steps: [
              {
                type: 'TYPE',
                description: 'Enter first name',
                target: { selector: 'input[name="firstName"]' },
                value: 'John'
              },
              {
                type: 'TYPE',
                description: 'Enter last name', 
                target: { selector: 'input[name="lastName"]' },
                value: 'Doe'
              },
              {
                type: 'TYPE',
                description: 'Enter email address',
                target: { selector: 'input[name="email"]' },
                value: 'john.doe@example.com'
              },
              {
                type: 'TYPE',
                description: 'Enter contact number',
                target: { selector: 'input[name="contactNumber"]' },
                value: '+1234567890'
              }
            ],
            reasoning: 'Fill out basic candidate information fields'
          })
        };
      } else {
        return {
          content: JSON.stringify({
            steps: [
              {
                type: 'CLICK',
                description: 'Submit the form',
                target: { 
                  selector: 'button[type="submit"], .save-button',
                  description: 'Submit/Save button'
                }
              },
              {
                type: 'WAIT',
                description: 'Wait for confirmation message',
                timeout: 3000
              }
            ],
            reasoning: 'Submit form and wait for confirmation'
          })
        };
      }
    }
  }

  async generateStructuredJSON(prompt: string, systemPrompt?: string): Promise<{ content: string }> {
    return this.generateText(prompt, systemPrompt);
  }

  isConfigured(): boolean {
    return true;
  }
}

async function demonstrateHierarchicalPlanning() {
  console.log('🧠 Hierarchical Planning Demonstration\n');
  console.log('=' .repeat(60));

  // Create planners
  const mockAI = new MockAIEngine() as any;
  const actionPlanner = new ActionPlanner(mockAI);
  const hierarchicalPlanner = new HierarchicalPlanner(mockAI, actionPlanner);

  // Test instruction
  const instruction = 'Navigate to https://opensource-demo.orangehrmlive.com/ and create candidate, login if needed';
  
  console.log(`📝 Original Instruction:`);
  console.log(`   "${instruction}"\n`);

  // Check if it should use hierarchical planning
  const shouldUseHierarchical = await hierarchicalPlanner.shouldUseHierarchicalPlanning(instruction);
  console.log(`🤔 Should use hierarchical planning: ${shouldUseHierarchical ? '✅ YES' : '❌ NO'}\n`);

  if (shouldUseHierarchical) {
    // Create context
    const context: TaskContext = {
      id: 'demo-task',
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

    try {
      // Create hierarchical plan
      const hierarchicalPlan = await hierarchicalPlanner.createHierarchicalPlan(instruction, context);

      console.log(`🏗️  HIERARCHICAL PLAN CREATED`);
      console.log(`   Strategy: ${hierarchicalPlan.planningStrategy}`);
      console.log(`   Sub-plans: ${hierarchicalPlan.subPlans.length}`);
      console.log(`   Total estimated duration: ${hierarchicalPlan.totalEstimatedDuration}ms\n`);

      console.log(`📋 GLOBAL PLAN BREAKDOWN:`);
      hierarchicalPlan.subPlans.forEach((subPlan, index) => {
        console.log(`   ${index + 1}. ${subPlan.objective}`);
      });
      console.log('');

      // Show detailed sub-plans
      console.log(`🔍 DETAILED SUB-PLANS:\n`);
      
      hierarchicalPlan.subPlans.forEach((subPlan, index) => {
        console.log(`   📍 Sub-plan ${index + 1}: ${subPlan.objective}`);
        console.log(`   ├─ Steps: ${subPlan.steps.length}`);
        console.log(`   ├─ Duration: ${subPlan.estimatedDuration}ms`);
        console.log(`   └─ Actions:`);
        
        subPlan.steps.forEach((step, stepIndex) => {
          const isLast = stepIndex === subPlan.steps.length - 1;
          const prefix = isLast ? '      └─' : '      ├─';
          console.log(`${prefix} ${step.type}: ${step.description}`);
        });
        console.log('');
      });

      console.log(`✨ Hierarchical planning demonstrates how complex instructions are:`);
      console.log(`   1. Broken down into logical sub-objectives`);
      console.log(`   2. Each sub-objective gets detailed action planning`);
      console.log(`   3. Actions are more focused and contextual`);
      console.log(`   4. Better error handling and recovery per sub-plan`);

    } catch (error) {
      console.error(`❌ Error creating hierarchical plan:`, error instanceof Error ? error.message : error);
    }
  } else {
    console.log(`📝 This instruction would use standard planning instead.`);
  }
}

// Run the demonstration
if (require.main === module) {
  demonstrateHierarchicalPlanning().catch(console.error);
}

export { demonstrateHierarchicalPlanning };
