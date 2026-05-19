# MCP Server - Docker Deployment

This directory contains the Docker configuration for the MCP (Model Context Protocol) Server microservice.

## 📦 Quick Start

### Build the Docker Image

```bash
# From the monorepo root
docker compose build mcp-server

# Or directly from this directory
docker build -t mcp-server .
```

### Run the Container

```bash
# Using docker-compose (recommended)
docker compose up -d mcp-server

# Standalone
docker run -d --name mcp-server mcp-server
```

## 🏗️ Docker Architecture

The Dockerfile uses a **multi-stage build** approach to optimize image size and security:

### Stage 1: Dependencies

- Installs all dependencies (including devDependencies)
- Uses Chinese npm mirror for faster downloads
- Ignores build scripts to avoid Alpine compatibility issues

### Stage 2: Builder

- Compiles TypeScript to JavaScript
- Produces optimized production code in `dist/` directory

### Stage 3: Production

- Minimal runtime environment
- Only production dependencies
- Non-root user for security (`appuser`)
- No exposed ports (TCP microservice)
- No health check (pure message consumer)

## 🔧 Configuration

### Environment Variables

The service reads configuration from `.env` file (see parent directory):

```env
NODE_ENV=production
RABBITMQ_URL=amqp://user:pass@rabbitmq:5672
```

### Network

The service connects to the `ai-agent-network` bridge network and communicates with RabbitMQ.

## 🚀 Deployment

### Development

```bash
docker compose -f docker-compose.dev.yml up mcp-server
```

### Production

```bash
docker compose up -d mcp-server
```

### Rolling Updates

The service is configured for zero-downtime rolling updates in `docker-compose.yml`:

```yaml
deploy:
  update_config:
    parallelism: 1
    delay: 10s
    order: stop-first
    failure_action: rollback
```

## 🔍 Troubleshooting

### View Logs

```bash
docker logs -f ai-agent-mcp-service
```

### Check Container Status

```bash
docker inspect ai-agent-mcp-service
```

### Rebuild Without Cache

```bash
docker compose build mcp-server --no-cache
```

## 📝 Notes

- **No HTTP Port**: This is a TCP microservice that consumes messages from RabbitMQ, not an HTTP server
- **No Health Check**: As a pure message consumer, it relies on Docker's restart policy instead of HTTP health checks
- **Alpine Linux**: Uses `node:22-alpine` for minimal image size (~528MB)
- **Non-root User**: Runs as `appuser` (UID 1001) for security best practices
- **Build Scripts**: Uses `--ignore-scripts` to avoid pnpm build approval issues on Alpine

## 🐛 Common Issues

### Build Fails with "ERR_PNPM_IGNORED_BUILDS"

This is expected and handled by using `--ignore-scripts` flag. The NestJS core postinstall script is not required for runtime.

### Slow Dependency Installation

The Dockerfile uses the Chinese npm mirror (`https://registry.npmmirror.com`) for faster downloads in China.

### Container Exits Immediately

Check the logs for connection errors to RabbitMQ:

```bash
docker logs ai-agent-mcp-service
```

Ensure RabbitMQ is running and accessible.

## 📊 Image Size

- **Base Image**: node:22-alpine
- **Final Size**: ~528MB
- **Optimization**: Multi-stage build reduces final image size by excluding devDependencies and build tools
