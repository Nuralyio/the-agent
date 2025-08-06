# Test Server

This directory contains a local test server that provides stable test pages for browser automation tests, replacing external dependencies like httpbin.org.

## Purpose

The test server provides:
- **Stability**: No external network dependencies
- **Reliability**: Consistent responses and uptime
- **Performance**: Fast local responses without network latency
- **Control**: Full control over test page content and behavior

## Available Test Pages

### 1. HTML Test Page (`/html`)
- **URL**: `http://localhost:3001/html`
- **Purpose**: Basic HTML content for navigation and screenshot tests
- **Features**:
  - Simple HTML structure
  - Various elements for testing
  - Consistent content for reliable screenshots

### 2. Pizza Order Form (`/forms/post`)
- **URL**: `http://localhost:3001/forms/post`
- **Purpose**: Complex form testing with all input types
- **Features**:
  - Text inputs (name, phone, email)
  - Radio buttons (pizza size)
  - Checkboxes (toppings)
  - Time input (delivery time)
  - Textarea (delivery instructions)
  - Form submission handling

### 3. Contact Form (`/contact`)
- **URL**: `http://localhost:3001/contact`
- **Purpose**: Simple form testing
- **Features**:
  - Basic form fields
  - Form validation
  - Submission handling

### 4. Health Check (`/health`)
- **URL**: `http://localhost:3001/health`
- **Purpose**: Server status monitoring
- **Returns**: JSON status response

## Usage

### Automatic Management
The test server is automatically started and stopped by the test runner. When you run tests, the server:

1. Starts automatically before tests begin
2. Serves test pages during test execution
3. Stops automatically after tests complete

### Manual Management
You can also run the test server manually for development:

```bash
# Start the test server
npm run test:server

# Or run directly
node test-server/server.js

# Server will be available at http://localhost:3001
```

### URL Replacement
The test framework automatically replaces httpbin.org URLs with local test server URLs:

- `https://httpbin.org/html` → `http://localhost:3001/html`
- `https://httpbin.org/forms/post` → `http://localhost:3001/forms/post`

## Configuration

The test server can be configured with environment variables:

- `TEST_SERVER_PORT`: Port number (default: 3001)

## Benefits Over External Services

### Before (httpbin.org)
- ❌ Network dependency
- ❌ Potential downtime
- ❌ Rate limiting
- ❌ Variable response times
- ❌ CI/CD failures due to connectivity

### After (Local Test Server)
- ✅ No network dependency
- ✅ 100% uptime during tests
- ✅ No rate limiting
- ✅ Consistent fast responses
- ✅ Reliable CI/CD execution

## Test Integration

The test server integrates seamlessly with existing tests:

```typescript
import { getTestServer, replaceHttpbinUrls } from '../test-server';

// Get the test server instance
const testServer = getTestServer();

// Replace external URLs with local ones
const localInstruction = replaceHttpbinUrls(
  "Navigate to https://httpbin.org/forms/post",
  testServer
);
// Result: "Navigate to http://localhost:3001/forms/post"
```

## Files

- `server.js` - Main Express server
- `package.json` - Server dependencies
- `README.md` - This documentation

## Dependencies

- `express` - Web framework
- `cors` - Cross-origin resource sharing
- `@types/express` - TypeScript types
- `@types/cors` - TypeScript types
