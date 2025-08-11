import { BrowserManagerImpl } from '../../managers/browser-manager';
import { BrowserAdapterRegistry } from '../../adapters/adapter-registry';
import {
  BrowserAdapter,
  BrowserInstance,
  PageInstance,
  LaunchOptions,
  ScreenshotOptions,
  BrowserType
} from '../../types';

// Mock the adapter registry
jest.mock('../../adapters/adapter-registry');

describe('BrowserManagerImpl', () => {
  let browserManager: BrowserManagerImpl;
  let mockRegistry: jest.Mocked<BrowserAdapterRegistry>;
  let mockAdapter: jest.Mocked<BrowserAdapter>;
  let mockBrowser: jest.Mocked<BrowserInstance>;
  let mockPage: jest.Mocked<PageInstance>;

  beforeEach(() => {
    // Create mocks
    mockPage = {
      navigate: jest.fn(),
      getTitle: jest.fn(),
      getUrl: jest.fn(),
      screenshot: jest.fn(),
      findElement: jest.fn(),
      findElements: jest.fn(),
      waitForElement: jest.fn(),
      close: jest.fn(),
      content: jest.fn(),
      click: jest.fn(),
      type: jest.fn(),
      waitForSelector: jest.fn(),
      evaluate: jest.fn(),
      waitForLoad: jest.fn()
    } as jest.Mocked<PageInstance>;

    mockBrowser = {
      type: 'chromium' as any,
      newPage: jest.fn(),
      close: jest.fn(),
      pages: jest.fn(),
      createPage: jest.fn(),
      isConnected: jest.fn(),
      version: jest.fn()
    } as jest.Mocked<BrowserInstance>;

    mockAdapter = {
      name: 'test-adapter',
      type: 'chromium' as any,
      launch: jest.fn(),
      isAvailable: jest.fn(),
      getSupportedBrowsers: jest.fn(),
      getDefaultOptions: jest.fn()
    } as jest.Mocked<BrowserAdapter>;

    mockRegistry = {
      adapters: new Map(),
      register: jest.fn(),
      get: jest.fn(),
      getAvailable: jest.fn(),
      getAdapterNames: jest.fn(),
      has: jest.fn(),
      unregister: jest.fn(),
      getBestAdapter: jest.fn(),
      getAdapterForBrowser: jest.fn(),
      autoSelectAdapter: jest.fn(),
      calculateAdapterScore: jest.fn(),
      isAdapterAvailable: jest.fn(),
      registerDefaultAdapters: jest.fn()
    } as any;

    // Mock the registry constructor
    (BrowserAdapterRegistry as jest.MockedClass<typeof BrowserAdapterRegistry>).mockImplementation(() => mockRegistry);

    browserManager = new BrowserManagerImpl();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create a new BrowserAdapterRegistry instance', () => {
      expect(BrowserAdapterRegistry).toHaveBeenCalled();
    });
  });

  describe('setAdapter', () => {
    it('should set the current adapter', () => {
      browserManager.setAdapter(mockAdapter);
      // We can't directly test private property, but we can test the behavior
      expect(() => browserManager.setAdapter(mockAdapter)).not.toThrow();
    });
  });

  describe('launchBrowser', () => {
    beforeEach(() => {
      mockRegistry.autoSelectAdapter.mockResolvedValue(mockAdapter);
      mockAdapter.getDefaultOptions.mockReturnValue({ headless: true });
      mockAdapter.launch.mockResolvedValue(mockBrowser);
    });

    it('should auto-select adapter if none is set', async () => {
      const options: LaunchOptions = { headless: false };
      
      const result = await browserManager.launchBrowser(options);

      expect(mockRegistry.autoSelectAdapter).toHaveBeenCalled();
      expect(mockAdapter.getDefaultOptions).toHaveBeenCalled();
      expect(mockAdapter.launch).toHaveBeenCalledWith({ headless: false });
      expect(result).toBe(mockBrowser);
    });

    it('should use current adapter if already set', async () => {
      browserManager.setAdapter(mockAdapter);
      
      const result = await browserManager.launchBrowser();

      expect(mockRegistry.autoSelectAdapter).not.toHaveBeenCalled();
      expect(mockAdapter.launch).toHaveBeenCalled();
      expect(result).toBe(mockBrowser);
    });

    it('should merge options with default options', async () => {
      const defaultOptions = { headless: true, args: ['--no-sandbox'] };
      const customOptions: LaunchOptions = { headless: false, timeout: 5000 };
      
      mockAdapter.getDefaultOptions.mockReturnValue(defaultOptions);
      
      await browserManager.launchBrowser(customOptions);

      expect(mockAdapter.launch).toHaveBeenCalledWith({
        headless: false,
        args: ['--no-sandbox'],
        timeout: 5000
      });
    });

    it('should store launch options for future use', async () => {
      const options: LaunchOptions = { headless: false, timeout: 10000 };
      
      await browserManager.launchBrowser(options);
      
      // Launch again without options to test if stored options are used
      await browserManager.createPage();
      
      // The browser should have been launched with stored options
      expect(mockAdapter.launch).toHaveBeenCalledTimes(1);
    });
  });

  describe('createPage', () => {
    beforeEach(() => {
      mockRegistry.autoSelectAdapter.mockResolvedValue(mockAdapter);
      mockAdapter.getDefaultOptions.mockReturnValue({ headless: true });
      mockAdapter.launch.mockResolvedValue(mockBrowser);
      mockBrowser.createPage.mockResolvedValue(mockPage);
    });

    it('should create a page when browser is already launched', async () => {
      await browserManager.launchBrowser();
      
      const result = await browserManager.createPage('https://example.com');

      expect(mockBrowser.createPage).toHaveBeenCalledWith('https://example.com');
      expect(result).toBe(mockPage);
    });

    it('should launch browser first if not already launched', async () => {
      const result = await browserManager.createPage('https://example.com');

      expect(mockAdapter.launch).toHaveBeenCalled();
      expect(mockBrowser.createPage).toHaveBeenCalledWith('https://example.com');
      expect(result).toBe(mockPage);
    });

    it('should create page without URL', async () => {
      await browserManager.launchBrowser();
      
      const result = await browserManager.createPage();

      expect(mockBrowser.createPage).toHaveBeenCalledWith(undefined);
      expect(result).toBe(mockPage);
    });
  });

  describe('closeBrowser', () => {
    beforeEach(() => {
      mockRegistry.autoSelectAdapter.mockResolvedValue(mockAdapter);
      mockAdapter.getDefaultOptions.mockReturnValue({ headless: true });
      mockAdapter.launch.mockResolvedValue(mockBrowser);
      mockBrowser.createPage.mockResolvedValue(mockPage);
    });

    it('should close page and browser', async () => {
      await browserManager.launchBrowser();
      await browserManager.createPage();
      
      await browserManager.closeBrowser();

      expect(mockPage.close).toHaveBeenCalled();
      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should handle case when no page or browser is open', async () => {
      await expect(browserManager.closeBrowser()).resolves.not.toThrow();
    });
  });

  describe('takeScreenshot', () => {
    beforeEach(() => {
      mockRegistry.autoSelectAdapter.mockResolvedValue(mockAdapter);
      mockAdapter.getDefaultOptions.mockReturnValue({ headless: true });
      mockAdapter.launch.mockResolvedValue(mockBrowser);
      mockBrowser.createPage.mockResolvedValue(mockPage);
    });

    it('should take screenshot with options', async () => {
      const mockBuffer = Buffer.from('screenshot-data');
      mockPage.screenshot.mockResolvedValue(mockBuffer);
      
      await browserManager.createPage();
      
      const options: ScreenshotOptions = { fullPage: true, path: 'test.png' };
      const result = await browserManager.takeScreenshot(options);

      expect(mockPage.screenshot).toHaveBeenCalledWith(options);
      expect(result).toBe(mockBuffer);
    });

    it('should throw error when no page is active', async () => {
      await expect(browserManager.takeScreenshot()).rejects.toThrow(
        'No active page. Create a page first.'
      );
    });
  });

  describe('getCurrentPage', () => {
    beforeEach(() => {
      mockRegistry.autoSelectAdapter.mockResolvedValue(mockAdapter);
      mockAdapter.getDefaultOptions.mockReturnValue({ headless: true });
      mockAdapter.launch.mockResolvedValue(mockBrowser);
      mockBrowser.createPage.mockResolvedValue(mockPage);
    });

    it('should return current page when available', async () => {
      await browserManager.createPage();
      
      const result = await browserManager.getCurrentPage();

      expect(result).toBe(mockPage);
    });

    it('should return null when no page is active', async () => {
      const result = await browserManager.getCurrentPage();

      expect(result).toBeNull();
    });
  });

  describe('isReady', () => {
    beforeEach(() => {
      mockRegistry.autoSelectAdapter.mockResolvedValue(mockAdapter);
      mockAdapter.getDefaultOptions.mockReturnValue({ headless: true });
      mockAdapter.launch.mockResolvedValue(mockBrowser);
      mockBrowser.createPage.mockResolvedValue(mockPage);
      mockBrowser.isConnected.mockReturnValue(true);
    });

    it('should return true when browser and page are ready', async () => {
      await browserManager.launchBrowser();
      await browserManager.createPage();
      
      const result = browserManager.isReady();

      expect(result).toBe(true);
    });

    it('should return false when no browser is launched', () => {
      const result = browserManager.isReady();

      expect(result).toBe(false);
    });

    it('should return false when browser is launched but no page is created', async () => {
      await browserManager.launchBrowser();
      
      const result = browserManager.isReady();

      expect(result).toBe(false);
    });
  });

  describe('getRegistry', () => {
    it('should return the adapter registry', () => {
      const result = browserManager.getRegistry();

      expect(result).toBe(mockRegistry);
    });
  });
});
