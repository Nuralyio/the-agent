# @theagent/api

A structured Express.js API server for browser automation framework with real-time execution streaming.

## 📁 Project Structure

```
src/
├── app.ts                    # Main application class
├── server.ts                 # Server startup script
├── index.ts                  # Package exports
├── controllers/              # Request handlers
│   ├── automation.controller.ts
│   ├── execution.controller.ts
│   └── health.controller.ts
├── routes/                   # Express routes
│   ├── index.ts
│   ├── automation.routes.ts
│   ├── execution.routes.ts
│   └── health.routes.ts
├── services/                 # Business logic
│   ├── index.ts
│   ├── config.service.ts
│   └── automation.service.ts
├── middleware/               # Express middleware
│   └── index.ts
├── types/                    # TypeScript interfaces
│   └── index.ts
└── utils/                    # Utility functions
    └── app.utils.ts
```

## Features

- 🌐 **REST API**: Complete HTTP API for automation control
- � **Real-time Streaming**: Server-Sent Events for live updates
- 📊 **Visualization**: Live automation monitoring and screenshots
- 🎯 **Session Management**: Multiple automation sessions
- 📝 **Logging**: Comprehensive execution logging
- 🔒 **CORS Support**: Cross-origin resource sharing
- 🏗️ **Modular Architecture**: Clean separation of concerns
- 🤖 **AI Integration**: Automatic AI provider configuration

## Installation

```bash
npm install @theagent/api-server
```

## Usage

```typescript
import { AutomationApiServer } from '@theagent/api-server';

const server = new AutomationApiServer(3002);
await server.start();
```

## API Endpoints

- `GET /api/status` - Server status
- `GET /api/sessions` - List execution sessions
- `GET /api/sessions/:id` - Session details
- `POST /api/execute` - Execute automation task
- `GET /api/execution/stream` - Server-Sent Events stream

## Development

```bash
npm run dev    # Start development server
npm run build  # Build for production
npm run start  # Start production server
```
