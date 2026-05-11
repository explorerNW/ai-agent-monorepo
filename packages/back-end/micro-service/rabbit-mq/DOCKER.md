# RabbitMQ Microservice - Docker Setup

## Overview

This directory contains the NestJS-based RabbitMQ microservice that handles message queue operations for the AI Agent platform.

## Architecture

The RabbitMQ microservice is orchestrated with Docker Compose and includes:

1. **RabbitMQ Server** (`rabbitmq:3-management-alpine`)
   - AMQP protocol port: 5672
   - Management UI port: 15672
   - Persistent data storage via Docker volume

2. **RabbitMQ Microservice** (NestJS application)
   - HTTP port: 3002
   - Connects to RabbitMQ server via internal Docker network
   - Processes messages from the `chat.general` queue

## Quick Start

### Production Environment

```bash
# Build and start all services (including RabbitMQ)
docker-compose up -d

# View logs
docker-compose logs -f rabbit-mq-service

# Access RabbitMQ Management UI
# http://localhost:15672
# Username: guest
# Password: guest
```

### Development Environment

```bash
# Start development environment with hot-reload
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f back-end
```

## Configuration

### Environment Variables

The microservice uses the following environment variables:

- `NODE_ENV`: Runtime environment (production/development)
- `RABBITMQ_URL`: RabbitMQ connection URL (default: `amqp://guest:guest@rabbitmq:5672`)

### Docker Compose Services

#### Production (`docker-compose.yml`)

```yaml
services:
  rabbitmq: # RabbitMQ server with management UI
  rabbit-mq-service: # NestJS microservice
  back-end: # Main backend (depends on rabbit-mq-service)
  front-end: # Frontend application
```

#### Development (`docker-compose.dev.yml`)

```yaml
services:
  rabbitmq: # RabbitMQ server with management UI
  back-end: # Main backend with hot-reload
  front-end: # Frontend with hot-reload
```

## Service Dependencies

```
front-end → back-end → rabbit-mq-service → rabbitmq
```

- Frontend depends on backend being healthy
- Backend depends on rabbit-mq-service starting
- RabbitMQ microservice depends on RabbitMQ server being healthy

## Ports

| Service           | Container Port | Host Port | Description          |
| ----------------- | -------------- | --------- | -------------------- |
| rabbitmq          | 5672           | 5672      | AMQP Protocol        |
| rabbitmq          | 15672          | 15672     | Management UI        |
| rabbit-mq-service | 3002           | 3002      | Microservice HTTP    |
| back-end          | 3000           | 3000      | Main Backend API     |
| front-end         | 3000           | 3001      | Frontend Application |

## Management

### Accessing RabbitMQ Management UI

1. Open browser: `http://localhost:15672`
2. Login credentials:
   - Username: `guest`
   - Password: `guest`

### Useful Commands

```bash
# Check service status
docker-compose ps

# Restart RabbitMQ microservice
docker-compose restart rabbit-mq-service

# View RabbitMQ logs
docker-compose logs -f rabbitmq

# View microservice logs
docker-compose logs -f rabbit-mq-service

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes persistent data)
docker-compose down -v
```

### Health Checks

- **RabbitMQ Server**: Uses `rabbitmq-diagnostics ping` every 30 seconds
- **Backend**: Uses HTTP check on port 3000 every 30 seconds

## Data Persistence

RabbitMQ data is persisted in Docker volumes:

- **Production**: `rabbitmq-data`
- **Development**: `rabbitmq-data-dev`

To backup RabbitMQ data:

```bash
docker run --rm -v rabbitmq-data:/data -v $(pwd):/backup alpine tar czf /backup/rabbitmq-backup.tar.gz -C /data .
```

## Troubleshooting

### Microservice Cannot Connect to RabbitMQ

1. Check if RabbitMQ container is running:

   ```bash
   docker-compose ps rabbitmq
   ```

2. Check RabbitMQ logs:

   ```bash
   docker-compose logs rabbitmq
   ```

3. Verify network connectivity:
   ```bash
   docker-compose exec rabbit-mq-service ping rabbitmq
   ```

### Management UI Not Accessible

1. Ensure port 15672 is not blocked by firewall
2. Check if RabbitMQ container is running:
   ```bash
   docker-compose logs rabbitmq
   ```

### Microservice Not Processing Messages

1. Check microservice logs:

   ```bash
   docker-compose logs -f rabbit-mq-service
   ```

2. Verify queue configuration in `src/main.ts`
3. Check RabbitMQ Management UI for queue status

## Security Notes

⚠️ **Production Deployment**: Change default credentials before deploying to production!

Update in `docker-compose.yml`:

```yaml
environment:
  - RABBITMQ_DEFAULT_USER=your-username
  - RABBITMQ_DEFAULT_PASS=your-strong-password
```

And update the microservice `.env` file accordingly:

```env
RABBITMQ_URL=amqp://your-username:your-strong-password@rabbitmq:5672
```

## Development Tips

### Hot Reload

In development mode, the backend service supports hot reload. Changes to source code will automatically restart the service.

### Local Development Without Docker

If you prefer to run RabbitMQ locally:

```bash
# Install RabbitMQ via Homebrew (macOS)
brew install rabbitmq

# Start RabbitMQ
brew services start rabbitmq

# Access Management UI
# http://localhost:15672
```

Then update your `.env` file:

```env
RABBITMQ_URL=amqp://guest:guest@localhost:5672
```

## Additional Resources

- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [NestJS Microservices](https://docs.nestjs.com/microservices/basics)
- [AMQP Connection Manager](https://github.com/jwalton/amqp-connection-manager)
