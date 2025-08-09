# @theagent/api-server

HTTP API server for the browser automation framework. Provides REST API endpoints and WebSocket connections for real-time automation visualization and control.

## Features

- 🌐 **REST API**: Complete HTTP API for automation control
- 🔌 **WebSocket Support**: Real-time execution streaming  
- 📊 **Visualization**: Live automation monitoring and screenshots
- 🎯 **Session Management**: Multiple automation sessions
- 📝 **Logging**: Comprehensive execution logging
- 🔒 **CORS Support**: Cross-origin resource sharing

## Installation

```bash
npm install @theagent/api-server
```

## Usage

```typescript
import { VisualizationServer } from '@theagent/api-server';

const server = new VisualizationServer(3002);
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
