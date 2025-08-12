module.exports = {
  "adapter": "playwright",
  "browser": "chrome",
  "headless": false,
  "timeout": 30000,
  "retries": 3,
  "ai": {
    "provider": "openai",
    "model": "gpt-4o",
    "baseUrl": "https://api.openai.com/v1",
    "apiKey": ""
  },
  "screenshots": {
    "enabled": true,
    "path": "./screenshots"
  }
};
