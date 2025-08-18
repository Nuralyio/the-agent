import { AIConfig, AIEngine, AIProvider, AIResponse } from '../../engine/ai-engine';
import { OllamaProvider } from '../../providers';
import { PageState } from '../../types';

// Mock the OllamaProvider
jest.mock('../../providers');

describe('AIEngine', () => {
  let aiEngine: AIEngine;
  let mockProvider: jest.Mocked<AIProvider>;

  beforeEach(() => {
    aiEngine = new AIEngine();

    mockProvider = {
      name: 'test-provider',
      config: {
        model: 'test-model',
        baseUrl: 'http://localhost:11434'
      },
      visionCapabilities: {
        supportsImages: false,
        supportedFormats: []
      },
      generateText: jest.fn(),
      generateStructuredJSON: jest.fn(),
      generateWithVision: jest.fn(),
      generateFromMessages: jest.fn(),
      healthCheck: jest.fn(),
      getAvailableModels: jest.fn()
    } as jest.Mocked<AIProvider>;

    // Mock OllamaProvider constructor
    (OllamaProvider as jest.MockedClass<typeof OllamaProvider>).mockImplementation(
      () => mockProvider as any
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerProvider', () => {
    it('should register a provider', () => {
      aiEngine.registerProvider(mockProvider);

      const retrievedProvider = aiEngine.getProvider('test-provider');
      expect(retrievedProvider).toBe(mockProvider);
    });

    it('should set first provider as default', () => {
      aiEngine.registerProvider(mockProvider);

      const defaultProvider = aiEngine.getDefaultProvider();
      expect(defaultProvider).toBe(mockProvider);
    });

    it('should not change default provider when adding second provider', () => {
      const secondProvider: AIProvider = {
        ...mockProvider,
        name: 'second-provider'
      };

      aiEngine.registerProvider(mockProvider);
      aiEngine.registerProvider(secondProvider);

      const defaultProvider = aiEngine.getDefaultProvider();
      expect(defaultProvider).toBe(mockProvider);
    });
  });

  describe('addProvider', () => {
    it('should create and register Ollama provider', () => {
      const config: AIConfig = {
        model: 'llama3.2',
        baseUrl: 'http://localhost:11434'
      };

      aiEngine.addProvider('ollama', config);

      expect(OllamaProvider).toHaveBeenCalledWith(config);
      expect(aiEngine.getProvider('test-provider')).toBe(mockProvider);
    });

    it('should throw error for unsupported provider', () => {
      const config: AIConfig = {
        model: 'test-model'
      };

      expect(() => aiEngine.addProvider('unsupported', config)).toThrow(
        'Unsupported AI provider: unsupported. Supported providers: \'ollama\', \'openai\'.'
      );
    });
  });

  describe('setDefaultProvider', () => {
    beforeEach(() => {
      aiEngine.registerProvider(mockProvider);
    });

    it('should set default provider', () => {
      const secondProvider: AIProvider = {
        ...mockProvider,
        name: 'second-provider'
      };
      aiEngine.registerProvider(secondProvider);

      aiEngine.setDefaultProvider('second-provider');

      const defaultProvider = aiEngine.getDefaultProvider();
      expect(defaultProvider).toBe(secondProvider);
    });

    it('should throw error for non-existent provider', () => {
      expect(() => aiEngine.setDefaultProvider('non-existent')).toThrow(
        'Provider \'non-existent\' not found'
      );
    });
  });

  describe('getDefaultProvider', () => {
    it('should return default provider when available', () => {
      aiEngine.registerProvider(mockProvider);

      const result = aiEngine.getDefaultProvider();
      expect(result).toBe(mockProvider);
    });

    it('should throw error when no default provider is configured', () => {
      expect(() => aiEngine.getDefaultProvider()).toThrow(
        'No default AI provider configured'
      );
    });
  });

  describe('generateText', () => {
    beforeEach(() => {
      aiEngine.registerProvider(mockProvider);
    });

    it('should call generateText on default provider', async () => {
      const prompt = 'Test prompt';
      const systemPrompt = 'Test system prompt';
      const expectedResponse: AIResponse = {
        content: 'Generated text',
        finishReason: 'stop'
      };

      mockProvider.generateText.mockResolvedValue(expectedResponse);

      const result = await aiEngine.generateText(prompt, systemPrompt);

      expect(mockProvider.generateText).toHaveBeenCalledWith(prompt, systemPrompt);
      expect(result).toBe(expectedResponse);
    });

    it('should work without system prompt', async () => {
      const prompt = 'Test prompt';
      const expectedResponse: AIResponse = {
        content: 'Generated text'
      };

      mockProvider.generateText.mockResolvedValue(expectedResponse);

      const result = await aiEngine.generateText(prompt);

      expect(mockProvider.generateText).toHaveBeenCalledWith(prompt, undefined);
      expect(result).toBe(expectedResponse);
    });
  });

  describe('generateStructuredJSON', () => {
    beforeEach(() => {
      aiEngine.registerProvider(mockProvider);
    });

    it('should use provider structured JSON method when available', async () => {
      const prompt = 'Generate JSON';
      const systemPrompt = 'System prompt';
      const expectedResponse: AIResponse = {
        content: '{"key": "value"}'
      };

      (mockProvider.generateStructuredJSON as jest.Mock).mockResolvedValue(expectedResponse);

      const result = await aiEngine.generateStructuredJSON(prompt, systemPrompt);

      expect(mockProvider.generateStructuredJSON).toHaveBeenCalledWith(prompt, systemPrompt);
      expect(result).toBe(expectedResponse);
    });

    it('should fallback to regular text generation with enhanced prompting', async () => {
      const prompt = 'Generate JSON';
      const systemPrompt = 'System prompt';
      const expectedResponse: AIResponse = {
        content: '{"key": "value"}'
      };

      // Remove structured JSON method to test fallback
      delete mockProvider.generateStructuredJSON;
      mockProvider.generateText.mockResolvedValue(expectedResponse);

      const result = await aiEngine.generateStructuredJSON(prompt, systemPrompt);

      expect(mockProvider.generateText).toHaveBeenCalledWith(
        prompt,
        expect.stringContaining('CRITICAL: You MUST respond with ONLY valid JSON')
      );
      expect(result).toBe(expectedResponse);
    });

    it('should handle fallback without system prompt', async () => {
      const prompt = 'Generate JSON';
      const expectedResponse: AIResponse = {
        content: '{"key": "value"}'
      };

      delete mockProvider.generateStructuredJSON;
      mockProvider.generateText.mockResolvedValue(expectedResponse);

      const result = await aiEngine.generateStructuredJSON(prompt);

      // Expect the call to include the full structured JSON template
      expect(mockProvider.generateText).toHaveBeenCalledWith(
        prompt,
        expect.stringContaining('CRITICAL: You MUST respond with ONLY valid JSON. No markdown formatting, no code blocks, no comments, no explanations.')
      );
      expect(result).toBe(expectedResponse);
    });
  });

  describe('generateWithVision', () => {
    beforeEach(() => {
      aiEngine.registerProvider(mockProvider);
    });

    it('should call generateWithVision when provider supports it', async () => {
      const prompt = 'Describe this image';
      const images = [Buffer.from('image-data')];
      const systemPrompt = 'You are an image analyzer';
      const expectedResponse: AIResponse = {
        content: 'This image shows...'
      };

      (mockProvider.generateWithVision as jest.Mock).mockResolvedValue(expectedResponse);

      const result = await aiEngine.generateWithVision(prompt, images, systemPrompt);

      expect(mockProvider.generateWithVision).toHaveBeenCalledWith(prompt, images, systemPrompt);
      expect(result).toBe(expectedResponse);
    });

    it('should throw error when provider does not support vision', async () => {
      const prompt = 'Describe this image';
      const images = [Buffer.from('image-data')];

      delete mockProvider.generateWithVision;

      await expect(aiEngine.generateWithVision(prompt, images)).rejects.toThrow(
        'Provider \'test-provider\' does not support vision capabilities'
      );
    });
  });

  describe('parseInstructionToSteps', () => {
    beforeEach(() => {
      aiEngine.registerProvider(mockProvider);
      aiEngine.setDefaultProvider('test-provider');
    });

    it('should parse instruction to action steps', async () => {
      const instruction = 'Navigate to google.com and search for cats';
      const pageState: PageState = {
        url: 'about:blank',
        title: '',
        elements: [],
        timestamp: Date.now()
      };

      const mockStepsResponse: AIResponse = {
        content: JSON.stringify([
          {
            type: 'NAVIGATE',
            selector: '',
            value: 'https://google.com',
            description: 'Navigate to Google'
          },
          {
            type: 'TYPE',
            selector: 'input[name="q"]',
            value: 'cats',
            description: 'Type search query'
          }
        ])
      };

      (mockProvider.generateText as jest.Mock).mockResolvedValue(mockStepsResponse);

      const result = await aiEngine.parseInstructionToSteps(instruction, pageState);

      expect(mockProvider.generateText).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('NAVIGATE');
      expect(result[1].type).toBe('TYPE');
    });

    it('should handle malformed JSON response', async () => {
      const instruction = 'Click on something';
      const pageState: PageState = {
        url: 'about:blank',
        title: '',
        elements: [],
        timestamp: Date.now()
      };

      const mockResponse: AIResponse = {
        content: 'Invalid JSON response'
      };

      (mockProvider.generateText as jest.Mock).mockResolvedValue(mockResponse);

      const result = await aiEngine.parseInstructionToSteps(instruction, pageState);
      expect(result).toEqual([{
        id: 'fallback-extract',
        type: 'extract',
        description: 'Process instruction: Click on something'
      }]);
    });
  });

  describe('getProvider', () => {
    it('should return provider when exists', () => {
      aiEngine.registerProvider(mockProvider);

      const result = aiEngine.getProvider('test-provider');
      expect(result).toBe(mockProvider);
    });

    it('should return undefined when provider does not exist', () => {
      const result = aiEngine.getProvider('non-existent');
      expect(result).toBeUndefined();
    });
  });
});
