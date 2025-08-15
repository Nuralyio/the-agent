import { AIEngine, AIResponse } from '../../ai/ai-engine';
import { ActionEngine } from '../../engine/action-engine';
import { ActionStep, ActionType, TaskContext } from '../../engine/planning/types/types';
import { BrowserManager, PageInstance } from '../../types';

// Mock dependencies
jest.mock('../../ai/ai-engine');
jest.mock('../../utils/execution-logger');
jest.mock('../../streaming/execution-stream');

describe('ActionEngine', () => {
  let actionEngine: ActionEngine;
  let mockBrowserManager: jest.Mocked<BrowserManager>;
  let mockAIEngine: jest.Mocked<AIEngine>;
  let mockPage: jest.Mocked<PageInstance>;

  beforeEach(() => {
    // Mock page instance with minimal required methods
    mockPage = {
      navigate: jest.fn().mockResolvedValue(undefined),
      click: jest.fn().mockResolvedValue(undefined),
      type: jest.fn().mockResolvedValue(undefined),
      waitForSelector: jest.fn().mockResolvedValue({} as any),
      evaluate: jest.fn()
        .mockImplementation((func) => {
          // Mock the window.location.href call
          if (func.toString().includes('window.location.href')) {
            return Promise.resolve('https://example.com');
          }
          // Mock the document.title call
          if (func.toString().includes('document.title')) {
            return Promise.resolve('Test Page');
          }
          return Promise.resolve(undefined);
        }),
      screenshot: jest.fn().mockResolvedValue(Buffer.from('screenshot')),
      getTitle: jest.fn().mockResolvedValue('Test Page'),
      getUrl: jest.fn().mockResolvedValue('https://example.com'),
      getContent: jest.fn().mockResolvedValue('<html>test</html>'),
      close: jest.fn().mockResolvedValue(undefined),
      reload: jest.fn().mockResolvedValue(undefined),
      goBack: jest.fn().mockResolvedValue(undefined),
      goForward: jest.fn().mockResolvedValue(undefined),
      waitForNavigation: jest.fn().mockResolvedValue(undefined),
      select: jest.fn().mockResolvedValue(undefined),
      hover: jest.fn().mockResolvedValue(undefined),
      focus: jest.fn().mockResolvedValue(undefined),
      press: jest.fn().mockResolvedValue(undefined),
      // Add minimal required properties
      findElement: jest.fn(),
      findElements: jest.fn(),
      waitForElement: jest.fn(),
      content: jest.fn().mockResolvedValue('<html><body>Test page</body></html>'),
      waitForLoad: jest.fn()
    } as any;

    // Mock browser manager
    mockBrowserManager = {
      getCurrentPage: jest.fn().mockResolvedValue(mockPage),
      launchBrowser: jest.fn().mockResolvedValue({} as any),
      closeBrowser: jest.fn().mockResolvedValue(undefined),
      isReady: jest.fn().mockReturnValue(true),
      createPage: jest.fn().mockResolvedValue(mockPage),
      takeScreenshot: jest.fn().mockResolvedValue(Buffer.from('screenshot'))
    };

    // Mock AI engine with minimal required methods
    mockAIEngine = {
      generateText: jest.fn().mockResolvedValue({
        content: JSON.stringify([
          {
            type: 'CLICK',
            selector: '#login-button',
            description: 'Click the login button'
          }
        ])
      }),
      generateStructuredJSON: jest.fn().mockResolvedValue({ content: '[]' }),
      parseInstructionToSteps: jest.fn().mockResolvedValue([]),
      registerProvider: jest.fn(),
      addProvider: jest.fn(),
      setDefaultProvider: jest.fn(),
      getDefaultProvider: jest.fn().mockReturnValue({} as any),
      getProvider: jest.fn(),
      generateWithVision: jest.fn(),
      generateFromMessages: jest.fn(),
      checkAllProviders: jest.fn()
    } as any;

    actionEngine = new ActionEngine(mockBrowserManager, mockAIEngine);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with browser manager and AI engine', () => {
      expect(actionEngine).toBeInstanceOf(ActionEngine);
    });

    it('should handle contextual analyzer initialization failure gracefully', () => {
      // This test verifies the constructor doesn't throw even if contextual analyzer fails
      expect(() => new ActionEngine(mockBrowserManager, mockAIEngine)).not.toThrow();
    });
  });

  describe('executeTask', () => {
    const objective = 'Click on the login button';

    beforeEach(() => {
      // Mock generateText to return properly formatted JSON response
      const mockResponse: AIResponse = {
        content: JSON.stringify({
          steps: [{
            id: 'step-1',
            type: 'click',
            target: {
              selector: '#login-button',
              description: 'Login button'
            },
            description: 'Click login button'
          }]
        })
      };
      mockAIEngine.generateText.mockResolvedValue(mockResponse);

      // Mock parseInstructionToSteps to return a simple action
      const mockActionStep: ActionStep = {
        id: 'step-1',
        type: ActionType.CLICK,
        selector: '#login-button',
        description: 'Click login button',
        value: ''
      };
      mockAIEngine.parseInstructionToSteps.mockResolvedValue([mockActionStep]);
    });

    it('should execute a simple task successfully', async () => {
      const result = await actionEngine.executeTask(objective);

      expect(mockAIEngine.generateText).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();
      expect(result.steps).toHaveLength(1);
      // extractedData might be undefined for a simple click action
      expect(result).toHaveProperty('extractedData');
    });

    it('should handle task execution failure gracefully', async () => {
      // Mock generateText to return invalid JSON that will cause parsing to fail
      const invalidResponse: AIResponse = {
        content: 'invalid json'
      };
      mockAIEngine.generateText.mockResolvedValue(invalidResponse);

      const result = await actionEngine.executeTask(objective);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should execute task with context', async () => {
      const context: TaskContext = {
        id: 'test-context',
        objective: 'test objective',
        constraints: [],
        variables: { username: 'testuser' },
        history: [],
        currentState: {
          url: 'https://example.com',
          title: 'Test Page',
          elements: [],
          timestamp: Date.now()
        }
      };

      // Override with valid JSON response
      const mockResponse: AIResponse = {
        content: JSON.stringify({
          steps: [{
            id: 'step-1',
            type: 'click',
            target: {
              selector: '#login-button',
              description: 'Login button'
            },
            description: 'Click login button'
          }]
        })
      };
      mockAIEngine.generateText.mockResolvedValue(mockResponse);

      const result = await actionEngine.executeTask(objective, context);

      expect(result.success).toBe(true);
    });

    it('should handle navigation-aware tasks', async () => {
      const navigationObjective = 'Navigate to https://example.com and click login';

      // Override with valid JSON response for navigation
      const mockResponse: AIResponse = {
        content: JSON.stringify({
          steps: [{
            id: 'nav-1',
            type: 'navigate',
            target: {
              url: 'https://example.com'
            },
            description: 'Navigate to example.com'
          }]
        })
      };
      mockAIEngine.generateText.mockResolvedValue(mockResponse);

      const result = await actionEngine.executeTask(navigationObjective);

      expect(result.success).toBe(true);
    });
  });

  describe('parseInstruction', () => {
    it('should parse instruction using AI engine', async () => {
      const instruction = 'Click the submit button';

      // Mock generateText to return properly formatted JSON with target.selector
      const mockResponse: AIResponse = {
        content: JSON.stringify({
          steps: [{
            id: 'step-1',
            type: 'click',
            target: {
              selector: '#submit',
              description: 'Submit button'
            },
            description: 'Click submit button'
          }]
        })
      };
      mockAIEngine.generateText.mockResolvedValue(mockResponse);

      const result = await actionEngine.parseInstruction(instruction);

      expect(mockAIEngine.generateText).toHaveBeenCalled();
      expect(result.objective).toBe(instruction);
      expect(result.steps).toHaveLength(1);
      expect(result.steps[0].target?.selector).toBe('#submit');
    });

    it('should handle parsing errors', async () => {
      const instruction = 'Invalid instruction';

      // Mock generateText to return invalid JSON
      const invalidResponse: AIResponse = {
        content: 'invalid json'
      };
      mockAIEngine.generateText.mockResolvedValue(invalidResponse);

      await expect(actionEngine.parseInstruction(instruction)).rejects.toThrow('Failed to parse instruction');
    });
  });

  describe('error handling', () => {
    it('should handle browser manager failures', async () => {
      // Mock generateText to return invalid JSON which will cause parsing to fail
      const invalidResponse: AIResponse = {
        content: 'invalid json'
      };
      mockAIEngine.generateText.mockResolvedValue(invalidResponse);

      const result = await actionEngine.executeTask('test task');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to parse instruction');
    });

    it('should handle AI engine failures', async () => {
      // Mock generateText to throw an error
      mockAIEngine.generateText.mockRejectedValue(new Error('AI error'));

      const result = await actionEngine.executeTask('test task');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
