const { BrowserMCPTools } = require('../dist/tools');

describe('BrowserMCPTools', () => {
  let tools;

  beforeEach(() => {
    tools = new BrowserMCPTools();
  });

  test('should be instantiated', () => {
    expect(tools).toBeInstanceOf(BrowserMCPTools);
  });

  test('should return tool definitions', () => {
    const definitions = tools.getToolDefinitions();
    expect(definitions).toBeDefined();
    expect(Array.isArray(definitions)).toBe(true);
    expect(definitions.length).toBeGreaterThan(0);
  });

  test('should include browser_navigate tool', () => {
    const definitions = tools.getToolDefinitions();
    const navigateTool = definitions.find(tool => tool.name === 'browser_navigate');
    
    expect(navigateTool).toBeDefined();
    expect(navigateTool.description).toContain('Navigate');
    expect(navigateTool.inputSchema.required).toContain('url');
  });

  test('should include all expected tools', () => {
    const definitions = tools.getToolDefinitions();
    const toolNames = definitions.map(tool => tool.name);
    
    const expectedTools = [
      'browser_navigate',
      'browser_execute',
      'browser_screenshot',
      'browser_extract_text',
      'browser_get_page_info',
      'browser_click',
      'browser_type',
      'browser_wait',
      'browser_close'
    ];

    expectedTools.forEach(toolName => {
      expect(toolNames).toContain(toolName);
    });
  });

  test('should throw error for unknown tool', async () => {
    const mockAutomation = {};
    
    await expect(
      tools.executeTool('unknown_tool', {}, mockAutomation)
    ).rejects.toThrow('Unknown tool: unknown_tool');
  });

  test('tool definitions should have proper structure', () => {
    const definitions = tools.getToolDefinitions();
    
    definitions.forEach(tool => {
      expect(tool).toHaveProperty('name');
      expect(tool).toHaveProperty('description');
      expect(tool).toHaveProperty('inputSchema');
      expect(tool.inputSchema).toHaveProperty('type', 'object');
      expect(tool.inputSchema).toHaveProperty('properties');
    });
  });

  test('required fields should be correct', () => {
    const definitions = tools.getToolDefinitions();
    
    const navigateTool = definitions.find(tool => tool.name === 'browser_navigate');
    expect(navigateTool.inputSchema.required).toContain('url');
    
    const executeTool = definitions.find(tool => tool.name === 'browser_execute');
    expect(executeTool.inputSchema.required).toContain('instruction');
    
    const clickTool = definitions.find(tool => tool.name === 'browser_click');
    expect(clickTool.inputSchema.required).toContain('selector');
    
    const typeTool = definitions.find(tool => tool.name === 'browser_type');
    expect(typeTool.inputSchema.required).toEqual(['selector', 'text']);

    const waitTool = definitions.find(tool => tool.name === 'browser_wait');
    expect(waitTool.inputSchema.required).toContain('selector');
  });
});
