#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

/**
 * Development script to run all services simultaneously in the new monorepo structure
 */

console.log('🚀 Starting TheAgent development environment...\n');

// Start the API server (visualization server)
const apiServerProcess = spawn('npm', ['run', 'dev', '-w', 'packages/api'], {
  cwd: path.resolve(__dirname, '..', '..'),
  stdio: 'pipe'
});

// Start the web UI (frontend)
const webUIProcess = spawn('npm', ['run', 'dev', '-w', 'packages/web-ui'], {
  cwd: path.resolve(__dirname, '..', '..'),
  stdio: 'pipe'
});

// Start the test server
const testServerProcess = spawn('node', ['tools/test-server/server.js'], {
  cwd: path.resolve(__dirname, '..', '..'),
  stdio: 'pipe'
});

// Handle process outputs
apiServerProcess.stdout.on('data', (data) => {
  console.log(`🔧 [API Server] ${data.toString().trim()}`);
});

apiServerProcess.stderr.on('data', (data) => {
  console.error(`❌ [API Server] ${data.toString().trim()}`);
});

webUIProcess.stdout.on('data', (data) => {
  console.log(`🎨 [Web UI] ${data.toString().trim()}`);
});

webUIProcess.stderr.on('data', (data) => {
  console.error(`❌ [Web UI] ${data.toString().trim()}`);
});

testServerProcess.stdout.on('data', (data) => {
  console.log(`🧪 [Test Server] ${data.toString().trim()}`);
});

testServerProcess.stderr.on('data', (data) => {
  console.error(`❌ [Test Server] ${data.toString().trim()}`);
});

// Handle process exits
const cleanup = () => {
  console.log('\n🛑 Shutting down development environment...');
  apiServerProcess.kill();
  webUIProcess.kill();
  testServerProcess.kill();
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Handle individual process failures
apiServerProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ API Server process exited with code ${code}`);
  }
});

webUIProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Web UI process exited with code ${code}`);
  }
});

testServerProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Test server process exited with code ${code}`);
  }
});

console.log('✅ All services starting...');
console.log('📊 API Server: http://localhost:3002');
console.log('🎨 Web UI: http://localhost:3003');
console.log('🧪 Test Server: http://localhost:3005');
console.log('\nPress Ctrl+C to stop all services\n');
