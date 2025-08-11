import { BrowserAdapterRegistry } from '../../adapters/adapter-registry';
import { BrowserAdapter, BrowserRequirements, BrowserType } from '../../types';

// Mock the adapters
jest.mock('../../adapters/playwright/adapter');
jest.mock('../../adapters/puppeteer/adapter');

describe('BrowserAdapterRegistry', () => {
  let registry: BrowserAdapterRegistry;
  let mockAdapter: jest.Mocked<BrowserAdapter>;
  let mockAdapter2: jest.Mocked<BrowserAdapter>;

  beforeEach(() => {
    // Create a clean registry that doesn't auto-register default adapters
    registry = Object.create(BrowserAdapterRegistry.prototype);
    Object.defineProperty(registry, 'adapters', {
      value: new Map(),
      writable: true
    });

    mockAdapter = {
      name: 'playwright',
      type: BrowserType.CHROMIUM,
      isAvailable: jest.fn().mockResolvedValue(true),
      launch: jest.fn(),
      getDefaultOptions: jest.fn().mockReturnValue({ headless: true }),
      getSupportedBrowsers: jest.fn().mockReturnValue([BrowserType.CHROMIUM])
    } as jest.Mocked<BrowserAdapter>;

    mockAdapter2 = {
      name: 'puppeteer',
      type: BrowserType.FIREFOX,
      isAvailable: jest.fn().mockResolvedValue(true),
      launch: jest.fn(),
      getDefaultOptions: jest.fn().mockReturnValue({ headless: false }),
      getSupportedBrowsers: jest.fn().mockReturnValue([BrowserType.FIREFOX])
    } as jest.Mocked<BrowserAdapter>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default adapters', () => {
      // Create a real registry for this test
      const realRegistry = new BrowserAdapterRegistry();
      expect(realRegistry).toBeInstanceOf(BrowserAdapterRegistry);
      
      // Check that default adapters are registered
      const adapters = realRegistry.getAvailable();
      expect(adapters.length).toBeGreaterThan(0);
    });
  });

  describe('register', () => {
    it('should register an adapter', () => {
      registry.register(mockAdapter);
      
      const adapter = registry.get('playwright');
      expect(adapter).toBe(mockAdapter);
    });

    it('should overwrite existing adapter with same name', () => {
      registry.register(mockAdapter);
      
      const newAdapter = { ...mockAdapter, name: 'playwright' };
      registry.register(newAdapter);
      
      const adapter = registry.get('playwright');
      expect(adapter).toBe(newAdapter);
    });
  });

  describe('get', () => {
    beforeEach(() => {
      registry.register(mockAdapter);
    });

    it('should return adapter by name', () => {
      const adapter = registry.get('playwright');
      expect(adapter).toBe(mockAdapter);
    });

    it('should return undefined for non-existent adapter', () => {
      const adapter = registry.get('non-existent');
      expect(adapter).toBeUndefined();
    });
  });

  describe('getAvailable', () => {
    it('should return all registered adapters', () => {
      registry.register(mockAdapter);
      registry.register(mockAdapter2);
      
      const adapters = registry.getAvailable();
      expect(adapters).toContain(mockAdapter);
      expect(adapters).toContain(mockAdapter2);
    });

    it('should return empty array when no adapters are registered', () => {
      // Create a fresh registry without default adapters
      const freshRegistry = new BrowserAdapterRegistry();
      // Clear default adapters for testing
      freshRegistry['adapters'].clear();
      
      const adapters = freshRegistry.getAvailable();
      expect(adapters).toEqual([]);
    });
  });

  describe('getAdapterNames', () => {
    it('should return names of all registered adapters', () => {
      registry.register(mockAdapter);
      registry.register(mockAdapter2);
      
      const names = registry.getAdapterNames();
      expect(names).toContain('playwright');
      expect(names).toContain('puppeteer');
    });
  });

  describe('has', () => {
    beforeEach(() => {
      registry.register(mockAdapter);
    });

    it('should return true for existing adapter', () => {
      expect(registry.has('playwright')).toBe(true);
    });

    it('should return false for non-existing adapter', () => {
      expect(registry.has('non-existent')).toBe(false);
    });
  });

  describe('autoSelectAdapter', () => {
    beforeEach(() => {
      registry.register(mockAdapter);
      registry.register(mockAdapter2);
    });

    it('should select first available adapter', async () => {
      mockAdapter.isAvailable.mockResolvedValue(true);
      mockAdapter2.isAvailable.mockResolvedValue(false);
      
      const adapter = await registry.autoSelectAdapter();
      
      expect(adapter).toBe(mockAdapter);
      expect(mockAdapter.isAvailable).toHaveBeenCalled();
    });

    it('should skip unavailable adapters', async () => {
      mockAdapter.isAvailable.mockResolvedValue(false);
      mockAdapter2.isAvailable.mockResolvedValue(true);
      
      const adapter = await registry.autoSelectAdapter();
      
      expect(adapter).toBe(mockAdapter2);
      expect(mockAdapter.isAvailable).toHaveBeenCalled();
      expect(mockAdapter2.isAvailable).toHaveBeenCalled();
    });

    it('should throw error when no adapters are available', async () => {
      mockAdapter.isAvailable.mockResolvedValue(false);
      mockAdapter2.isAvailable.mockResolvedValue(false);
      
      await expect(registry.autoSelectAdapter()).rejects.toThrow(
        'No browser adapters are available'
      );
    });

    it('should handle adapter availability check failures', async () => {
      mockAdapter.isAvailable.mockRejectedValue(new Error('Check failed'));
      mockAdapter2.isAvailable.mockResolvedValue(true);
      
      const adapter = await registry.autoSelectAdapter();
      
      expect(adapter).toBe(mockAdapter2);
    });
  });

  describe('getBestAdapter', () => {
    beforeEach(() => {
      registry.register(mockAdapter);
      registry.register(mockAdapter2);
    });

    it('should select adapter based on requirements', () => {
      const requirements: BrowserRequirements = {
        browserType: BrowserType.CHROMIUM,
        performance: 'fast'
      };

      mockAdapter.isAvailable.mockResolvedValue(true);
      mockAdapter2.isAvailable.mockResolvedValue(true);
      
      const adapter = registry.getBestAdapter(requirements);
      
      expect(adapter).toBe(mockAdapter);
    });

    it('should throw error when no adapter meets requirements', () => {
      const requirements: BrowserRequirements = {
        browserType: BrowserType.WEBKIT
      };

      mockAdapter.isAvailable.mockResolvedValue(true);
      mockAdapter2.isAvailable.mockResolvedValue(true);
      
      expect(() => registry.getBestAdapter(requirements)).toThrow(
        'No adapter found for browser type: webkit'
      );
    });
  });

  describe('edge cases', () => {
    it('should handle empty adapter list', () => {
      const freshRegistry = new BrowserAdapterRegistry();
      freshRegistry['adapters'].clear();
      
      expect(freshRegistry.getAvailable()).toEqual([]);
      expect(freshRegistry.getAdapterNames()).toEqual([]);
      expect(freshRegistry.has('any')).toBe(false);
    });

    it('should handle adapter with missing optional methods gracefully', () => {
      const partialAdapter = {
        name: 'partial-adapter',
        type: BrowserType.CHROMIUM,
        isAvailable: jest.fn().mockResolvedValue(true),
        launch: jest.fn(),
        getDefaultOptions: jest.fn().mockReturnValue({}),
        getSupportedBrowsers: jest.fn().mockReturnValue([BrowserType.CHROMIUM])
      } as BrowserAdapter;

      registry.register(partialAdapter);
      
      expect(registry.has('partial-adapter')).toBe(true);
      expect(registry.get('partial-adapter')).toBe(partialAdapter);
    });

    it('should handle adapter registration with duplicate names', () => {
      registry.register(mockAdapter);
      
      const duplicateAdapter = {
        ...mockAdapter,
        type: BrowserType.FIREFOX
      };
      
      registry.register(duplicateAdapter);
      
      // Should overwrite the first adapter
      const retrieved = registry.get('playwright');
      expect(retrieved).toBeDefined();
      expect(retrieved!.type).toBe(BrowserType.FIREFOX);
    });
  });
});
