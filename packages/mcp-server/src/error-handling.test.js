const { BrowserMCPTools } = require('../dist/tools');

describe('BrowserMCPTools Error Handling', () => {
  let tools;

  beforeEach(() => {
    tools = new BrowserMCPTools();
  });

  describe('Tool argument validation', () => {
    test('should call browser automation methods with provided arguments', async () => {
      const mockBrowser = {
        navigate: jest.fn().mockResolvedValue(undefined),
        execute: jest.fn().mockResolvedValue({ result: 'success' })
      };

      // Test browser_navigate with URL
      await tools.executeTool('browser_navigate', { url: 'https://example.com' }, mockBrowser);
      expect(mockBrowser.navigate).toHaveBeenCalledWith('https://example.com');
      
      // Test browser_execute with instruction
      await tools.executeTool('browser_execute', { instruction: 'click button' }, mockBrowser);
      expect(mockBrowser.execute).toHaveBeenCalledWith('click button');
    });

    test('should handle browser automation errors', async () => {
      const mockBrowser = {
        navigate: jest.fn().mockRejectedValue(new Error('Navigation failed')),
        execute: jest.fn().mockRejectedValue(new Error('Execution failed'))
      };

      // Test browser_navigate error propagation
      await expect(tools.executeTool('browser_navigate', { url: 'https://example.com' }, mockBrowser))
        .rejects.toThrow('Navigation failed');
      
      // Test browser_execute error propagation
      await expect(tools.executeTool('browser_execute', { instruction: 'click button' }, mockBrowser))
        .rejects.toThrow('Execution failed');
    });

    test('should pass undefined arguments to browser methods', async () => {
      const mockBrowser = {
        navigate: jest.fn().mockResolvedValue(undefined),
        execute: jest.fn().mockResolvedValue({ result: 'success' })
      };

      // Test that undefined arguments are passed through
      await tools.executeTool('browser_navigate', {}, mockBrowser);
      expect(mockBrowser.navigate).toHaveBeenCalledWith(undefined);
      
      await tools.executeTool('browser_execute', {}, mockBrowser);
      expect(mockBrowser.execute).toHaveBeenCalledWith(undefined);
    });
  });

  describe('Tool definitions validation', () => {
    test('all tool definitions should have required properties', () => {
      const toolDefinitions = tools.getToolDefinitions();
      
      toolDefinitions.forEach(tool => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
        
        expect(typeof tool.name).toBe('string');
        expect(typeof tool.description).toBe('string');
        expect(typeof tool.inputSchema).toBe('object');
        
        expect(tool.name.length).toBeGreaterThan(0);
        expect(tool.description.length).toBeGreaterThan(0);
      });
    });

    test('tool input schemas should be valid JSON Schema objects', () => {
      const toolDefinitions = tools.getToolDefinitions();
      
      toolDefinitions.forEach(tool => {
        const schema = tool.inputSchema;
        expect(schema).toHaveProperty('type');
        expect(schema.type).toBe('object');
        
        if (schema.properties) {
          expect(typeof schema.properties).toBe('object');
        }
        
        if (schema.required) {
          expect(Array.isArray(schema.required)).toBe(true);
        }
      });
    });

    test('should have unique tool names', () => {
      const toolDefinitions = tools.getToolDefinitions();
      const toolNames = toolDefinitions.map(tool => tool.name);
      const uniqueNames = new Set(toolNames);
      
      expect(uniqueNames.size).toBe(toolNames.length);
    });
  });

  describe('Tool execution edge cases', () => {
    test('should handle null browser automation instance', async () => {
      await expect(tools.executeTool('browser_navigate', { url: 'https://example.com' }, null))
        .rejects.toThrow();
    });

    test('should handle undefined browser automation instance', async () => {
      await expect(tools.executeTool('browser_screenshot', {}, undefined))
        .rejects.toThrow();
    });

    test('should reject execution of non-existent tools', async () => {
      const mockBrowser = {
        navigate: jest.fn(),
        screenshot: jest.fn()
      };

      const invalidToolNames = [
        'invalid_tool',
        'browser_invalid',
        '',
        'browser_take_screenshot' // This is not a real tool name
      ];

      for (const toolName of invalidToolNames) {
        await expect(tools.executeTool(toolName, {}, mockBrowser))
          .rejects.toThrow(`Unknown tool: ${toolName}`);
      }
    });
  });

  describe('Tool registration', () => {
    test('should maintain consistent tool count', () => {
      const toolDefinitions1 = tools.getToolDefinitions();
      const toolDefinitions2 = tools.getToolDefinitions();
      
      expect(toolDefinitions1.length).toBe(toolDefinitions2.length);
      expect(toolDefinitions1.length).toBe(9); // Expected number of tools
    });

    test('should return immutable tool definitions', () => {
      const toolDefinitions = tools.getToolDefinitions();
      const originalLength = toolDefinitions.length;
      
      // Try to modify the returned array
      toolDefinitions.push({ name: 'test', description: 'test', inputSchema: {} });
      
      // Get fresh copy and verify it's unchanged
      const freshDefinitions = tools.getToolDefinitions();
      expect(freshDefinitions.length).toBe(originalLength);
    });
  });
});
