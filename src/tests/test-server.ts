import { spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';

const sleep = promisify(setTimeout);

export class TestServer {
  private serverProcess: ChildProcess | null = null;
  private port: number;
  private isRunning = false;

  constructor(port = 3001) {
    this.port = port;
  }

  /**
   * Start the test server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('🔄 Test server already running');
      return;
    }

    console.log(`🚀 Starting test server on port ${this.port}...`);

    // Set environment variable for server port
    const env = { ...process.env, TEST_SERVER_PORT: this.port.toString() };

    // Start the server process
    this.serverProcess = spawn('node', ['test-server/server.js'], {
      cwd: process.cwd(),
      env,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Handle server output
    this.serverProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      if (output.includes('running on')) {
        console.log('✅ Test server started successfully');
        this.isRunning = true;
      }
    });

    this.serverProcess.stderr?.on('data', (data) => {
      console.error('❌ Test server error:', data.toString());
    });

    this.serverProcess.on('exit', (code) => {
      console.log(`🛑 Test server exited with code ${code}`);
      this.isRunning = false;
      this.serverProcess = null;
    });

    // Wait for server to start
    await this.waitForServer();
  }

  /**
   * Stop the test server
   */
  async stop(): Promise<void> {
    if (!this.isRunning || !this.serverProcess) {
      console.log('🔄 Test server not running');
      return;
    }

    console.log('🛑 Stopping test server...');
    this.serverProcess.kill('SIGTERM');

    // Wait for graceful shutdown
    await sleep(1000);

    if (this.serverProcess && !this.serverProcess.killed) {
      console.log('🔪 Force killing test server...');
      this.serverProcess.kill('SIGKILL');
    }

    this.isRunning = false;
    this.serverProcess = null;
    console.log('✅ Test server stopped');
  }

  /**
   * Wait for the server to be ready
   */
  private async waitForServer(maxRetries = 30): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        // Try to fetch the health endpoint
        const response = await fetch(`http://localhost:${this.port}/health`);
        if (response.ok) {
          console.log('✅ Test server is ready');
          return;
        }
      } catch (error) {
        // Server not ready yet, wait and retry
      }

      await sleep(1000);
    }

    throw new Error(`Test server failed to start within ${maxRetries} seconds`);
  }

  /**
   * Get the base URL for the test server
   */
  getBaseUrl(): string {
    return `http://localhost:${this.port}`;
  }

  /**
   * Get URL for a specific test page
   */
  getUrl(path: string): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.getBaseUrl()}${cleanPath}`;
  }

  /**
   * Check if server is running
   */
  get running(): boolean {
    return this.isRunning;
  }
}

// Global test server instance
let globalTestServer: TestServer | null = null;

/**
 * Get or create the global test server instance
 */
export function getTestServer(): TestServer {
  if (!globalTestServer) {
    globalTestServer = new TestServer();
  }
  return globalTestServer;
}

/**
 * Helper function to replace httpbin URLs with local test server URLs
 */
export function replaceHttpbinUrls(instruction: string, testServer: TestServer): string {
  return instruction
    .replace(/https:\/\/httpbin\.org\/html/g, testServer.getUrl('/html'))
    .replace(/https:\/\/httpbin\.org\/forms\/post/g, testServer.getUrl('/forms/post'))
    .replace(/httpbin\.org/g, `localhost:${testServer.getBaseUrl().split(':')[2]}`);
}
