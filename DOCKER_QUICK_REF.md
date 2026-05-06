# Docker Quick Reference

## 🚀 Start Services

### Production Mode

```bash
./docker.sh start
# or
pnpm docker:start
```

- Front-end: http://localhost:3001
- Back-end: http://localhost:3000

### Development Mode (with hot-reload)

```bash
./docker.sh start:dev
# or
pnpm docker:start:dev
```

- Front-end: http://localhost:5173
- Back-end: http://localhost:3000

## 🛑 Stop Services

```bash
./docker.sh stop
# or
pnpm docker:stop
```

## 📋 View Logs

```bash
# All services
./docker.sh logs

# Backend only
./docker.sh logs:backend

# Frontend only
./docker.sh logs:frontend
```

## 🔧 Common Commands

| Command                      | Description                       |
| ---------------------------- | --------------------------------- |
| `./docker.sh build`          | Rebuild all images                |
| `./docker.sh restart`        | Restart all services              |
| `./docker.sh status`         | Show container status             |
| `./docker.sh clean`          | Remove all containers and volumes |
| `./docker.sh shell:backend`  | Access backend container shell    |
| `./docker.sh shell:frontend` | Access frontend container shell   |

## 📁 Configuration Files

- `docker-compose.yml` - Production configuration
- `docker-compose.dev.yml` - Development configuration
- `packages/back-end/Dockerfile` - Backend image definition
- `packages/front-end/Dockerfile` - Frontend production image
- `packages/front-end/Dockerfile.dev` - Frontend development image

## 🔍 Troubleshooting

**Port already in use:**

```bash
# Check what's using the port
lsof -i :3000
lsof -i :3001

# Or change ports in docker-compose.yml
```

**View detailed error logs:**

```bash
docker-compose logs --tail=100 back-end
docker-compose logs --tail=100 front-end
```

**Rebuild after code changes:**

```bash
./docker.sh build
./docker.sh restart
```

For complete documentation, see [DOCKER.md](./DOCKER.md)
