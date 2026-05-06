# AI Agent Monorepo - Docker Setup

This document explains how to run the AI Agent application using Docker and Docker Compose.

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose v2.0+
- At least 2GB of available memory

## 🚀 Quick Start

### Production Mode

Build and start both services in production mode:

```bash
docker-compose up -d --build
```

Access the application:

- **Front-end**: http://localhost:3001
- **Back-end API**: http://localhost:3000

### Development Mode

For development with hot-reload support:

```bash
docker-compose -f docker-compose.dev.yml up -d --build
```

Access the application:

- **Front-end**: http://localhost:5173
- **Back-end API**: http://localhost:3000

## 📦 Service Architecture

```
┌─────────────────┐         ┌─────────────────┐
│   Front-end     │────────▶│   Back-end      │
│   (React/Vite)  │         │   (NestJS)      │
│   Port: 3001    │         │   Port: 3000    │
└─────────────────┘         └────────┬────────┘
                                     │
                              ┌──────▼────────┐
                              │   Uploads     │
                              │   (Volume)    │
                              └───────────────┘
```

## 🔧 Configuration

### Environment Variables

#### Back-end (.env in packages/back-end/)

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Front-end URL (for CORS)
FRONT_END_URL=http://localhost:3001

# Add your other backend environment variables here
# e.g., DATABASE_URL, API_KEYS, etc.
```

#### Front-end (.env in packages/front-end/)

```env
# Back-end API URL
BACK_END_URL=http://localhost:3000

# Add your other frontend environment variables here
```

### Volume Management

The back-end service uses a Docker volume to persist uploaded files:

```yaml
volumes:
  backend-uploads:
    driver: local
```

To inspect the volume:

```bash
docker volume ls | grep backend-uploads
docker volume inspect backend-uploads
```

## 🛠️ Common Commands

### Build Services

```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build back-end
docker-compose build front-end
```

### Start/Stop Services

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Start specific service
docker-compose up -d back-end

# Restart a service
docker-compose restart back-end
```

### View Logs

```bash
# All services logs
docker-compose logs -f

# Specific service logs
docker-compose logs -f back-end
docker-compose logs -f front-end

# Last 100 lines
docker-compose logs --tail=100 back-end
```

### Execute Commands in Containers

```bash
# Access back-end container shell
docker exec -it ai-agent-backend sh

# Access front-end container shell
docker exec -it ai-agent-frontend sh

# Run commands in back-end
docker exec ai-agent-backend pnpm run test
```

### Clean Up

```bash
# Stop and remove containers, networks
docker-compose down

# Remove volumes as well
docker-compose down -v

# Remove images too
docker-compose down -v --rmi all
```

## 🏥 Health Checks

The back-end service includes a health check that verifies the server is responding:

```yaml
healthcheck:
  test:
    [
      "CMD",
      "wget",
      "--no-verbose",
      "--tries=1",
      "--spider",
      "http://localhost:3000/",
    ]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

Check health status:

```bash
docker inspect --format='{{.State.Health.Status}}' ai-agent-backend
```

## 🔍 Troubleshooting

### Port Already in Use

If ports 3000 or 3001 are already in use, modify the port mapping in `docker-compose.yml`:

```yaml
ports:
  - "3002:3000" # Map host port 3002 to container port 3000
```

### Container Won't Start

Check logs for errors:

```bash
docker-compose logs back-end
docker-compose logs front-end
```

Common issues:

- Missing environment variables
- Port conflicts
- Insufficient memory

### Rebuild After Code Changes

For production mode, rebuild after code changes:

```bash
docker-compose up -d --build
```

For development mode, changes should hot-reload automatically due to volume mounts.

### Network Issues

If services can't communicate:

```bash
# Check network
docker network ls | grep ai-agent-network

# Inspect network
docker network inspect ai-agent-monorepo_ai-agent-network
```

## 📊 Monitoring

### Resource Usage

```bash
# View container stats
docker stats ai-agent-backend ai-agent-frontend

# View specific metrics
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" ai-agent-backend
```

### Container Status

```bash
# List running containers
docker-compose ps

# Detailed container info
docker inspect ai-agent-backend
```

## 🔐 Security Best Practices

1. **Never commit `.env` files** - They're already in `.gitignore`
2. **Use secrets management** for sensitive data in production
3. **Keep base images updated** - Regularly rebuild with latest Node.js Alpine images
4. **Limit exposed ports** - Only expose necessary ports
5. **Use non-root user** in production (can be added to Dockerfile if needed)

## 🎯 Production Deployment

For production deployment, consider:

1. **Use specific image tags** instead of `latest`
2. **Add resource limits**:
   ```yaml
   deploy:
     resources:
       limits:
         cpus: "1"
         memory: 512M
   ```
3. **Use external secrets management** (Docker Secrets, Vault, etc.)
4. **Set up logging drivers** for centralized log management
5. **Configure backup** for persistent volumes
6. **Use HTTPS** with reverse proxy (nginx, traefik)

Example with resource limits:

```yaml
services:
  back-end:
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 1G
        reservations:
          cpus: "0.5"
          memory: 512M
```

## 📝 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [NestJS Docker Guide](https://docs.nestjs.com/recipes/docker)
- [React Router Deployment](https://reactrouter.com/en/main/guides/deployment)
