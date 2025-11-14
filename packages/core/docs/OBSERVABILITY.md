# LLM Observability

The Agent supports comprehensive LLM observability through OpenTelemetry and Langfuse integration. This allows you to monitor, trace, and analyze all LLM interactions in your automation workflows.

## Features

- **OpenTelemetry Tracing**: Distributed tracing for LLM operations
- **Langfuse Tracking**: Detailed LLM generation tracking and analytics
- **Token Usage Monitoring**: Track prompt and completion tokens
- **Latency Metrics**: Monitor LLM call performance
- **Error Tracking**: Capture and analyze LLM failures

## Configuration

### Environment Variables

Add the following to your `.env` file:

```bash
# Enable LLM observability
OBSERVABILITY_ENABLED=true

# OpenTelemetry Configuration
OTEL_ENABLED=true
OTEL_SERVICE_NAME=the-agent-llm
OTEL_ENDPOINT=http://localhost:4318/v1/traces

# Langfuse Configuration
LANGFUSE_ENABLED=true
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_BASE_URL=https://cloud.langfuse.com
```

### Programmatic Configuration

You can also configure observability programmatically:

```typescript
import { TheAgent } from '@theagent/core';

const agent = new TheAgent({
  adapter: 'playwright',
  ai: {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4',
    observability: {
      enabled: true,
      opentelemetry: {
        enabled: true,
        serviceName: 'my-agent',
        endpoint: 'http://localhost:4318/v1/traces',
      },
      langfuse: {
        enabled: true,
        publicKey: process.env.LANGFUSE_PUBLIC_KEY,
        secretKey: process.env.LANGFUSE_SECRET_KEY,
        baseUrl: 'https://cloud.langfuse.com',
      },
    },
  },
});

await agent.initialize();
```

## OpenTelemetry Setup

### Using Jaeger (Local Development)

1. Start Jaeger with Docker:

```bash
docker run -d --name jaeger \
  -e COLLECTOR_OTLP_ENABLED=true \
  -p 16686:16686 \
  -p 4318:4318 \
  jaegertracing/all-in-one:latest
```

2. Configure The Agent:

```bash
OTEL_ENABLED=true
OTEL_ENDPOINT=http://localhost:4318/v1/traces
```

3. Access Jaeger UI at http://localhost:16686

### Using Other OTLP Collectors

The Agent supports any OpenTelemetry Protocol (OTLP) compatible collector:

- **Grafana Tempo**
- **AWS X-Ray**
- **Google Cloud Trace**
- **Azure Monitor**
- **Datadog**
- **New Relic**

Configure your collector's OTLP HTTP endpoint in `OTEL_ENDPOINT`.

## Langfuse Setup

### Using Langfuse Cloud

1. Sign up at https://cloud.langfuse.com
2. Create a new project
3. Copy your public and secret keys
4. Configure The Agent:

```bash
LANGFUSE_ENABLED=true
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
```

### Self-Hosted Langfuse

1. Deploy Langfuse using Docker:

```bash
docker run -d --name langfuse \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  langfuse/langfuse:latest
```

2. Configure The Agent:

```bash
LANGFUSE_ENABLED=true
LANGFUSE_BASE_URL=http://localhost:3000
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
```

## Tracked Metrics

### Traces

Each LLM operation creates a span with the following attributes:

- `llm.provider`: AI provider name (e.g., "openai", "ollama")
- `llm.model`: Model name (e.g., "gpt-4", "llama3.2")
- `llm.operation`: Operation type (e.g., "generateText", "generateStructuredJSON")

### Metrics in Langfuse

- **Token Usage**:
  - Prompt tokens
  - Completion tokens
  - Total tokens
- **Latency**: End-to-end LLM call duration
- **Cost**: Automatically calculated based on model pricing
- **Input/Output**: Full prompt and completion content
- **Model Parameters**: Temperature, max tokens, etc.

## Usage Example

```typescript
import { TheAgent } from '@theagent/core';

// Create agent with observability enabled
const agent = new TheAgent({
  adapter: 'playwright',
  ai: {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4',
  },
});

await agent.initialize();

// All LLM calls are automatically traced
const result = await agent.execute(
  'Navigate to github.com and search for "typescript"'
);

// Cleanup
await agent.close();
```

## Advanced Configuration

### Selective Observability

Enable only specific components:

```typescript
const config = {
  observability: {
    enabled: true,
    opentelemetry: {
      enabled: true, // Only OpenTelemetry
      serviceName: 'my-agent',
      endpoint: 'http://localhost:4318/v1/traces',
    },
    langfuse: {
      enabled: false, // Disable Langfuse
    },
  },
};
```

### Custom Service Names

Use different service names for different environments:

```bash
# Development
OTEL_SERVICE_NAME=the-agent-dev

# Production
OTEL_SERVICE_NAME=the-agent-prod
```

## Troubleshooting

### OpenTelemetry Not Working

1. Verify the OTLP endpoint is accessible:
   ```bash
   curl http://localhost:4318/v1/traces
   ```

2. Check the console for initialization messages:
   ```
   ✅ OpenTelemetry tracer initialized
   ```

3. Ensure `OTEL_ENABLED=true` in your `.env`

### Langfuse Not Working

1. Verify credentials are correct
2. Check network connectivity to Langfuse
3. Look for error messages in console:
   ```
   ❌ Failed to initialize Langfuse tracker: ...
   ```

4. Ensure both public and secret keys are provided

### No Traces Appearing

1. Confirm `OBSERVABILITY_ENABLED=true`
2. Check that LLM calls are actually being made
3. Allow time for data to be flushed (up to 30 seconds)
4. Verify the collector/platform is properly configured

## Performance Impact

Observability has minimal performance impact:

- **OpenTelemetry**: ~1-5ms per LLM call
- **Langfuse**: ~5-10ms per LLM call
- **Total Overhead**: <1% of typical LLM latency

Both systems use asynchronous data export to minimize blocking.

## Privacy Considerations

### Data Collection

- **OpenTelemetry**: Collects operation metadata, not full prompts/completions
- **Langfuse**: Collects full prompts, completions, and metadata

### Sensitive Data

To avoid logging sensitive information:

1. Use only OpenTelemetry (disable Langfuse)
2. Filter sensitive data in prompts before passing to LLM
3. Deploy self-hosted solutions (Jaeger, Langfuse) for full control

## Best Practices

1. **Start Simple**: Enable observability in development first
2. **Monitor Costs**: Track token usage to optimize costs
3. **Set Up Alerts**: Configure alerts for high latency or errors
4. **Regular Review**: Periodically review traces to identify issues
5. **Privacy First**: Understand what data is being collected

## Support

For issues or questions about observability:

- OpenTelemetry: https://opentelemetry.io/docs/
- Langfuse: https://langfuse.com/docs
- The Agent: https://github.com/Nuralyio/the-agent/issues
