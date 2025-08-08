# API Server Package Structure

## Overview

The API server has been restructured into a well-organized Express.js application with clear separation of concerns.

## Directory Structure

```
src/
├── app.ts                    # Main application class
├── index.ts                  # Package exports
├── server.ts                 # Server startup script
├── controllers/              # Request handlers
│   ├── index.ts
│   ├── automation.controller.ts
│   ├── execution.controller.ts
│   └── health.controller.ts
├── middleware/               # Express middleware
│   └── index.ts
├── routes/                   # Route definitions
│   ├── index.ts
│   ├── automation.routes.ts
│   ├── execution.routes.ts
│   └── health.routes.ts
├── services/                 # Business logic
│   ├── index.ts
│   ├── automation.service.ts
│   └── config.service.ts
├── types/                    # TypeScript interfaces
│   └── index.ts
└── utils/                    # Utility functions
    └── app.utils.ts
```

## Architecture

### Controllers
Handle HTTP requests and responses, delegating business logic to services.

- `AutomationController` - Automation task execution endpoints
- `ExecutionController` - Execution streaming and status endpoints  
- `HealthController` - Health check endpoint

### Services
Contain business logic and interact with external dependencies.

- `AutomationService` - Browser automation execution and streaming
- `ConfigService` - Environment and AI configuration management

### Routes
Define API endpoints and map them to controller methods.

- `automation.routes.ts` - `/api/automation/*` endpoints
- `execution.routes.ts` - `/api/execution/*` endpoints
- `health.routes.ts` - `/health` endpoint

### Middleware
Express middleware for cross-cutting concerns.

- CORS configuration
- Request logging
- Error handling
- Basic Express setup (JSON parsing, static files)

### Types
TypeScript interfaces and type definitions for type safety.

### Utils
Utility functions and application setup helpers.

## Benefits of This Structure

1. **Separation of Concerns** - Each file has a single responsibility
2. **Maintainability** - Easier to locate and modify specific functionality
3. **Testability** - Individual components can be tested in isolation
4. **Scalability** - Easy to add new routes, controllers, and services
5. **Type Safety** - Comprehensive TypeScript interfaces
6. **Reusability** - Services and utilities can be used across the application

## Usage

The API server can still be used the same way:

```typescript
import { AutomationApiServer } from '@theagent/api';

const server = new AutomationApiServer(3002);
await server.start();
```

Individual components can also be imported and used separately:

```typescript
import { automationService, configService } from '@theagent/api';
import { AutomationController } from '@theagent/api';
```

## Migration

The original `api-server.ts` has been preserved but is no longer the main entry point. The new structure maintains full backward compatibility while providing better organization.
