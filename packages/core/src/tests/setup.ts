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

// Global test utilities - using declare global instead of direct assignment
declare global {
  var sleep: (ms: number) => Promise<void>;
}

globalThis.sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Browser automation test helpers
export const testConfig = {
  headless: true,
  slowMo: 0,
  timeout: 10000,
  screenshot: process.env.SCREENSHOT_TESTS === 'true'
};

// Global cleanup for better Jest exit handling
let globalCleanupTasks: (() => Promise<void>)[] = [];

export function addGlobalCleanupTask(task: () => Promise<void>) {
  globalCleanupTasks.push(task);
}

// Global teardown
afterAll(async () => {
  // Run all cleanup tasks
  for (const cleanup of globalCleanupTasks) {
    try {
      await cleanup();
    } catch (error) {
      console.warn('Cleanup task failed:', error);
    }
  }
  
  // Clear the array
  globalCleanupTasks = [];
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  // Wait a moment for final cleanup
  await new Promise(resolve => setTimeout(resolve, 100));
});
