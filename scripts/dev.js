#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

/**
 * Development script to run both backend and frontend simultaneously
 */

console.log('🚀 Starting development environment...\n');

// Start the visualization server
const backendProcess = spawn('npm', ['run', 'serve:visualization'], {
  cwd: path.resolve(__dirname, '..'),
  stdio: 'pipe'
});

// Start the frontend dev server
const frontendProcess = spawn('npm', ['run', 'dev'], {
  cwd: path.resolve(__dirname, '..', 'visualization-ui'),
  stdio: 'pipe'
});

// Start the test server
const testServerProcess = spawn('npm', ['run', 'test:server'], {
  cwd: path.resolve(__dirname, '..'),
  stdio: 'pipe'
});

// Handle process outputs
backendProcess.stdout.on('data', (data) => {
  console.log(`🔧 [Backend] ${data.toString().trim()}`);
});

backendProcess.stderr.on('data', (data) => {
  console.error(`❌ [Backend] ${data.toString().trim()}`);
});

frontendProcess.stdout.on('data', (data) => {
  console.log(`🎨 [Frontend] ${data.toString().trim()}`);
});

frontendProcess.stderr.on('data', (data) => {
  console.error(`❌ [Frontend] ${data.toString().trim()}`);
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
  backendProcess.kill();
  frontendProcess.kill();
  testServerProcess.kill();
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Handle individual process failures
backendProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Backend process exited with code ${code}`);
  }
});

frontendProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Frontend process exited with code ${code}`);
  }
});

testServerProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Test server process exited with code ${code}`);
  }
});

console.log('✅ All services starting...');
console.log('📊 Backend: http://localhost:3002');
console.log('🎨 Frontend: http://localhost:3003');
console.log('🧪 Test Server: http://localhost:3005');
console.log('\nPress Ctrl+C to stop all services\n');
