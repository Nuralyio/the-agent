// Jest setup file for browser automation tests
import 'dotenv/config';

// Increase timeout for browser automation tests
jest.setTimeout(30000);

// Mock console.log for cleaner test output
const originalLog = console.log;
console.log = (...args: any[]) => {
  if (process.env.NODE_ENV === 'test' && !process.env.VERBOSE_TESTS) {
    return;
  }
  originalLog(...args);
};

// Global test utilities
global.sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Browser automation test helpers
export const testConfig = {
  headless: true,
  slowMo: 0,
  timeout: 10000,
  screenshot: process.env.SCREENSHOT_TESTS === 'true'
};
