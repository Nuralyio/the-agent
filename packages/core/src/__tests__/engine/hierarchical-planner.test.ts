import { describe, expect, it, beforeEach, afterEach } from '@jest/testing-library/jest-dom';
import { ActionEngine } from '../engine/action-engine';
import { HierarchicalPlanner } from '../engine/planning/hierarchical-planner';
import { ActionPlanner } from '../engine/planning/action-planner';
import { AIEngine } from '../ai/ai-engine';
import { BrowserManager, ActionType, TaskContext } from '../types';

// Mock implementations
const mockBrowserManager: BrowserManager = {
  isReady: jest.fn().mockReturnValue(true),
  navigate: jest.fn().mockResolvedValue(undefined),
  click: jest.fn().mockResolvedValue(undefined),
  type: jest.fn().mockResolvedValue(undefined),
  fill: jest.fn().mockResolvedValue(undefined),
  takeScreenshot: jest.fn().mockResolvedValue(Buffer.from('screenshot')),
  getPageContent: jest.fn().mockResolvedValue('<html><body>Test</body></html>'),
  getPageTitle: jest.fn().mockResolvedValue('Test Page'),
  getCurrentUrl: jest.fn().mockResolvedValue('https://example.com'),
  close: jest.fn().mockResolvedValue(undefined),
  getElementText: jest.fn().mockResolvedValue('Test Text'),
  waitForElement: jest.fn().mockResolvedValue(true),
  scroll: jest.fn().mockResolvedValue(undefined),
  extractData: jest.fn().mockResolvedValue('Test Data'),
  capturePageState: jest.fn().mockResolvedValue({
    url: 'https://example.com',
    title: 'Test Page',
    elements: [],
    timestamp: Date.now(),
    content: '<html><body>Test</body></html>',
    viewport: { width: 1280, height: 720 }
  })
} as any;

const mockAIEngine: AIEngine = {
  generateText: jest.fn(),
  generateStructuredJSON: jest.fn(),
  isConfigured: jest.fn().mockReturnValue(true)
} as any;

describe('HierarchicalPlanner', () => {
  let hierarchicalPlanner: HierarchicalPlanner;
  let actionPlanner: ActionPlanner;
  let actionEngine: ActionEngine;

  beforeEach(() => {
    actionPlanner = new ActionPlanner(mockAIEngine);
    hierarchicalPlanner = new HierarchicalPlanner(mockAIEngine, actionPlanner);
    actionEngine = new ActionEngine(mockBrowserManager, mockAIEngine);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('shouldUseHierarchicalPlanning', () => {
    it('should return true for complex instructions', async () => {
      const complexInstruction = 'Navigate to https://opensource-demo.orangehrmlive.com/ and create candidate, login if needed';
      
      const result = await hierarchicalPlanner.shouldUseHierarchicalPlanning(complexInstruction);
      
      expect(result).toBe(true);
    });

    it('should return false for simple instructions', async () => {
      const simpleInstruction = 'Click the login button';
      
      const result = await hierarchicalPlanner.shouldUseHierarchicalPlanning(simpleInstruction);
      
      expect(result).toBe(false);
    });

    it('should return true for instructions with conjunctions', async () => {
      const instructionWithConjunction = 'Navigate to the website and then fill out the form with user details';
      
      const result = await hierarchicalPlanner.shouldUseHierarchicalPlanning(instructionWithConjunction);
      
      expect(result).toBe(true);
    });
  });

  describe('createHierarchicalPlan', () => {
    it('should create a hierarchical plan for complex instructions', async () => {
      // Mock AI response for global planning
      const mockGlobalPlanResponse = {
        content: JSON.stringify({
          subObjectives: [
            'Navigate to https://opensource-demo.orangehrmlive.com/',
            'Login to the system if authentication is required',
            'Navigate to the candidate management section',
            'Create a new candidate profile with required information'
          ],
          planningStrategy: 'sequential',
          reasoning: 'Multi-step workflow requiring navigation, authentication, section access, and form completion'
        })
      };

      // Mock AI response for action planning (sub-plans)
      const mockActionPlanResponse = {
        content: JSON.stringify({
          steps: [
            {
              type: 'NAVIGATE',
              description: 'Navigate to target URL',
              target: { url: 'https://opensource-demo.orangehrmlive.com/' }
            }
          ],
          reasoning: 'Navigation step'
        })
      };

      mockAIEngine.generateText
        .mockResolvedValueOnce(mockGlobalPlanResponse) // For global planning
        .mockResolvedValue(mockActionPlanResponse); // For sub-plan creation

      const instruction = 'Navigate to https://opensource-demo.orangehrmlive.com/ and create candidate, login if needed';
      const context: TaskContext = {
        id: 'test-context',
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

      const result = await hierarchicalPlanner.createHierarchicalPlan(instruction, context);

      expect(result).toBeDefined();
      expect(result.globalObjective).toBe(instruction);
      expect(result.subPlans).toHaveLength(4);
      expect(result.planningStrategy).toBe('sequential');
      expect(result.globalPlan.steps).toHaveLength(4);
      expect(result.globalPlan.steps[0].type).toBe(ActionType.EXECUTE_SUB_PLAN);
    });
  });

  describe('Integration with ActionEngine', () => {
    it('should use hierarchical planning for complex instructions', async () => {
      const complexInstruction = 'Navigate to example.com and create account then login';
      
      // Mock AI responses
      const mockGlobalPlanResponse = {
        content: JSON.stringify({
          subObjectives: [
            'Navigate to example.com',
            'Create new account',
            'Login with created credentials'
          ],
          planningStrategy: 'sequential',
          reasoning: 'Multi-step account creation workflow'
        })
      };

      const mockActionPlanResponse = {
        content: JSON.stringify({
          steps: [
            {
              type: 'NAVIGATE',
              description: 'Navigate to example.com',
              target: { url: 'https://example.com' }
            }
          ],
          reasoning: 'Navigation step'
        })
      };

      mockAIEngine.generateText
        .mockResolvedValueOnce(mockGlobalPlanResponse)
        .mockResolvedValue(mockActionPlanResponse);

      const result = await actionEngine.executeTask(complexInstruction);

      expect(result.success).toBe(true);
      expect(result.hierarchicalPlan).toBeDefined();
      expect(mockAIEngine.generateText).toHaveBeenCalledWith(
        expect.stringContaining('Break down this complex instruction'),
        expect.any(String)
      );
    });
  });
});

export {};
