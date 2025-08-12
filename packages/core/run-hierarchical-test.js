#!/usr/bin/env node

/**
 * Simple runner for the hierarchical planning test
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Running Hierarchical Planning Test with Real AI\n');

// Check if .env exists
const fs = require('fs');
const envPath = path.join(__dirname, '../../.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ No .env file found. Please copy .env.example to .env and configure your AI settings.');
  console.error('   Location: /Users/aymen/Desktop/projects/nuraly/TheAgent/Agent/.env');
  console.error('\n   Minimum configuration needed:');
  console.error('   OLLAMA_BASE_URL=http://localhost:11434');
  console.error('   OLLAMA_MODEL=llama2  # or any model you have installed');
  process.exit(1);
}

// Run the TypeScript file directly with tsx
const testFile = path.join(__dirname, 'examples/hierarchical-planning-demo.ts');
const child = spawn('npx', ['tsx', testFile], {
  stdio: 'inherit',
  cwd: path.join(__dirname, '../..')
});

child.on('error', (error) => {
  console.error('❌ Failed to run test:', error.message);
  process.exit(1);
});

child.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Hierarchical planning test completed successfully!');
  } else {
    console.error(`\n❌ Test failed with exit code ${code}`);
    process.exit(code);
  }
});
