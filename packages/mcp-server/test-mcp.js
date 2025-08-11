#!/usr/bin/env node

/**
 * Simple test script to verify MCP server functionality
 * Usage: node test-mcp.js
 */

const { spawn } = require('child_process');

// Test messages to send to the MCP server
const testMessages = [
  // Initialize
  {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test-client', version: '1.0.0' }
    }
  },
  
  // List tools
  {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {}
  },
  
  // Navigate to a website
  {
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'browser_navigate',
      arguments: {
        url: 'https://httpbin.org/html'
      }
    }
  },
  
  // Take a screenshot
  {
    jsonrpc: '2.0',
    id: 4,
    method: 'tools/call',
    params: {
      name: 'browser_screenshot',
      arguments: {}
    }
  },
  
  // Close browser
  {
    jsonrpc: '2.0',
    id: 5,
    method: 'tools/call',
    params: {
      name: 'browser_close',
      arguments: {}
    }
  }
];

async function testMCPServer() {
  console.log('🧪 Testing TheAgent MCP Server...\n');
  
  // Spawn the MCP server
  const serverProcess = spawn('node', ['dist/server.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  let messageIndex = 0;
  
  // Handle server output
  serverProcess.stdout.on('data', (data) => {
    const response = data.toString().trim();
    if (response) {
      try {
        const parsed = JSON.parse(response);
        console.log(`📨 Response ${parsed.id}:`, JSON.stringify(parsed, null, 2));
        
        // Send next message after a delay
        setTimeout(() => {
          if (messageIndex < testMessages.length) {
            sendMessage(testMessages[messageIndex++]);
          } else {
            console.log('\n✅ All tests completed');
            serverProcess.kill();
          }
        }, 2000);
        
      } catch (error) {
        console.log('📄 Server output:', response);
      }
    }
  });
  
  // Handle server errors
  serverProcess.stderr.on('data', (data) => {
    console.error('❌ Server error:', data.toString());
  });
  
  // Handle server exit
  serverProcess.on('close', (code) => {
    console.log(`\n🏁 Server exited with code ${code}`);
    process.exit(code);
  });
  
  // Function to send messages to the server
  function sendMessage(message) {
    console.log(`📤 Sending message ${message.id}:`, JSON.stringify(message, null, 2));
    serverProcess.stdin.write(JSON.stringify(message) + '\n');
  }
  
  // Start by sending the first message
  setTimeout(() => {
    sendMessage(testMessages[messageIndex++]);
  }, 1000);
}

// Handle script termination
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted');
  process.exit(0);
});

testMCPServer().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
