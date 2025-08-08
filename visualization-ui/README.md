# Browser Automation Visualizer

A modern React-based dashboard built with Remix.js and FluentUI for visualizing and controlling browser automation tasks in real-time.

## 🚀 Features

- **Real-time Visualization**: Live updates of browser automation execution via Server-Sent Events
- **Chat-based Control**: Natural language interface to trigger automation tasks
- **Step-by-Step Tracking**: Visual progression of automation steps with status indicators
- **Screenshot Viewer**: Live screenshots with zoom and controls
- **Modern UI**: Built with Microsoft FluentUI for a professional look and feel
- **Responsive Design**: Works on desktop and mobile devices

## 🏗️ Architecture

```
visualization-ui/
├── app/
│   ├── components/          # React components
│   │   ├── ChatInterface.tsx
│   │   ├── ExecutionSteps.tsx
│   │   └── ScreenshotViewer.tsx
│   ├── hooks/              # Custom React hooks
│   │   └── useVisualization.ts
│   ├── routes/             # Remix routes
│   │   └── _index.tsx
│   ├── utils/              # Utility functions
│   │   └── automationAPI.ts
│   ├── root.tsx            # App root component
│   ├── entry.client.tsx    # Client entry point
│   └── entry.server.tsx    # Server entry point
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🛠️ Setup & Installation

### Prerequisites

- Node.js 18+
- The main automation server running on `http://localhost:3002`

### Installation

1. **Install dependencies:**
   ```bash
   cd visualization-ui
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   ```
   http://localhost:3003
   ```

## 🎯 Usage

### Chat Interface

The chat interface allows you to control browser automation using natural language:

```
Examples:
- "Go to google.com"
- "Take a screenshot"
- "Search for automation tools"
- "Scroll down 500 pixels"
- "Click the submit button"
```

### Quick Commands

Pre-built commands for common automation tasks:
- Take a screenshot
- Go to google.com
- Scroll down 500 pixels
- Wait for 2 seconds
- Go to github.com and search for automation

### Real-time Updates

The dashboard automatically connects to the automation server and displays:
- Live execution steps
- Current browser screenshots
- Progress indicators
- Connection status

## 🔧 Configuration

### Server URL

By default, the app connects to `http://localhost:3002`. To change this:

```typescript
// In app/routes/_index.tsx
const [serverUrl] = useState("http://your-server:port");
```

### API Endpoints

The app uses these endpoints from the automation server:
- `GET /api/status` - Server status
- `GET /api/sessions` - List execution sessions
- `GET /api/sessions/:id` - Session details
- `GET /api/sessions/:id/steps/:index/screenshot` - Step screenshots
- `POST /api/execute` - Execute automation task
- `GET /api/execution/stream` - Server-Sent Events stream

## 🎨 Components

### ChatInterface

Interactive chat for automation control:
```typescript
<ChatInterface
  onExecuteTask={handleExecuteTask}
  loading={loading}
  error={error}
/>
```

### ExecutionSteps

Visual step tracker:
```typescript
<ExecutionSteps
  session={currentSession}
  onStepClick={handleStepClick}
  selectedStepIndex={selectedStep?.index}
/>
```

### ScreenshotViewer

Live screenshot display with zoom:
```typescript
<ScreenshotViewer
  screenshot={currentScreenshot}
  loading={loading}
  title="Live View"
/>
```

## 🔗 Integration

### With Existing Web Apps

Embed the dashboard in your application:

```html
<iframe 
  src="http://localhost:3003" 
  width="100%" 
  height="600px"
  style="border: 1px solid #ccc; border-radius: 8px;">
</iframe>
```

### Custom API Integration

Use the automation API directly:

```typescript
import { automationAPI, quickExecute } from '~/utils/automationAPI';

// Execute a task
const result = await quickExecute("take a screenshot");

// Get server status
const status = await automationAPI.getServerStatus();
```

## 🌟 Key Features Explained

### Real-time Communication

Uses Server-Sent Events (SSE) for live updates:
```typescript
const eventSource = new EventSource('/api/execution/stream');
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  handleExecutionEvent(data);
};
```

### State Management

React hooks manage application state:
```typescript
const { state, currentScreenshot } = useVisualizationStream(serverUrl);
const { loading, error, executeTask } = useVisualizationAPI(serverUrl);
```

### Responsive Design

FluentUI components provide responsive, accessible UI:
```typescript
<div style={{ 
  display: 'grid', 
  gridTemplateColumns: '1fr 1fr 1fr', 
  gap: '24px' 
}}>
  {/* Three-column layout on desktop */}
</div>
```

## 🚀 Deployment

### Production Build

```bash
npm run build
npm start
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3003
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 🐛 Troubleshooting

### Connection Issues

- Ensure the automation server is running on port 3002
- Check CORS settings on the server
- Verify network connectivity

### Build Issues

- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check TypeScript configuration
- Ensure all dependencies are compatible

### Performance Issues

- Enable React DevTools Profiler
- Check for unnecessary re-renders
- Optimize large data sets with virtualization

## 📚 Technologies Used

- **[Remix.js](https://remix.run/)** - Full-stack React framework
- **[FluentUI](https://developer.microsoft.com/fluentui)** - Microsoft's design system
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Vite](https://vitejs.dev/)** - Fast build tool
- **Server-Sent Events** - Real-time communication

## 📄 License

This project is part of the Browser Automation Framework and follows the same license terms.
