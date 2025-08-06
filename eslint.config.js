const tsEslint = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');

module.exports = [
  {
    ignores: ['node_modules/', 'dist/', 'build/', 'lib/', 'coverage/', '*.d.ts', 'tests/setup.ts']
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: ['**/*.d.ts', 'tests/setup.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module'
      }
    },
    plugins: {
      '@typescript-eslint': tsEslint
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn'
    }
  },
  {
    files: ['**/*.js', '**/*.jsx'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module'
    }
  }
];
