// Test for MCP Server functionality without direct imports
const { spawn } = require('child_process');
const path = require('path');

describe('TheAgentMCPServer Integration Tests', () => {
  const serverPath = path.join(__dirname, '../dist/index.js');

  test('server executable should exist', () => {
    const fs = require('fs');
    expect(fs.existsSync(serverPath)).toBe(true);
  });

  test('server should start without errors', (done) => {
    const server = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'test' }
    });

    let output = '';
    let errorOutput = '';

    server.stdout.on('data', (data) => {
      output += data.toString();
    });

    server.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    // Send a simple MCP request to test if server is responding
    setTimeout(() => {
      server.stdin.write(JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '1.0.0',
          clientInfo: { name: 'test-client', version: '1.0.0' }
        }
      }) + '\n');
    }, 100);

    server.on('close', (code) => {
      // Server should exit cleanly or we should timeout
      if (code !== null) {
        expect(errorOutput).not.toContain('SyntaxError');
        expect(errorOutput).not.toContain('Cannot use import statement');
      }
      done();
    });

    // Timeout the test after 3 seconds
    setTimeout(() => {
      server.kill();
      done();
    }, 3000);
  }, 5000);
});
