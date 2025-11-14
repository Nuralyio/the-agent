// TheAgent Configuration Template
// Copy this file to theagent.config.js and fill in your actual values
module.exports = {
  browser: {
    // Browser adapter: 'playwright', 'puppeteer', 'selenium', or 'auto'
    adapter: 'playwright',

    // Browser type: 'chrome', 'firefox', 'safari', 'edge', or 'chromium'
    type: 'chrome',

    // Run browser in headless mode
    headless: false,

    // Timeout for browser operations (milliseconds)
    timeout: 30000,

    // Number of retries on failure
    retries: 3
  },

  llm: {
    // Active LLM profile name
    active: 'local',

    // Available LLM profiles
    profiles: {
      // Local Ollama profile
      local: {
        provider: 'ollama',
        model: 'llama3:8b',
        baseUrl: 'http://localhost:11434',
        description: 'Local Ollama LLaMA model'
      },

      // OpenAI GPT-4 profile
      openai: {
        provider: 'openai',
        model: 'gpt-4o',
        baseUrl: 'https://api.openai.com/v1',
        // apiKey: process.env.OPENAI_API_KEY, // Set via environment
        description: 'OpenAI GPT-4o model'
      },

      // Anthropic Claude profile
      claude: {
        provider: 'anthropic',
        model: 'claude-3-sonnet',
        // apiKey: process.env.ANTHROPIC_API_KEY, // Set via environment
        description: 'Anthropic Claude 3 Sonnet'
      },

      // Development/testing profile
      dev: {
        provider: 'ollama',
        model: 'qwen2:7b',
        baseUrl: 'http://localhost:11434',
        temperature: 0.1,
        maxTokens: 1024,
        description: 'Development model with low temperature'
      }
    }
  },
  execution: {
    // Directory for execution logs
    logsDir: './execution-logs',

    // Directory for screenshots
    screenshotsDir: './screenshots',

    // Take screenshot on error
    screenshotOnError: true
  }
};
