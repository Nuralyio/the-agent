module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.{ts,js}',
    '**/?(*.)+(spec|test).{ts,js}'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/src/tests/integration/',
    '<rootDir>/packages/core/src/tests/integration/',
    '<rootDir>/packages/*/src/tests/integration/'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,js}',
    '!src/**/*.spec.{ts,js}'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  testTimeout: 10000, // 30 seconds for browser automation tests
  verbose: true,
  // Force Jest to exit after tests complete
  forceExit: true,
  // Detect open handles for debugging
  detectOpenHandles: true,
  // Maximum number of worker processes
  maxWorkers: 1
};
