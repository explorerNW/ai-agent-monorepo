# RabbitMQ Microservice - Quick Reference Card

## 🚀 Quick Start

```bash
# Production (all services including RabbitMQ)
./docker.sh start

# Development (with hot-reload)
./docker.sh start:dev

# Check status
./docker.sh status
```

## 🌐 Access URLs

| Service      | URL                    | Credentials |
| ------------ | ---------------------- | ----------- |
| Frontend     | http://localhost:3001  | -           |
| Backend API  | http://localhost:3000  | -           |
| RabbitMQ UI  | http://localhost:15672 | guest/guest |
| Microservice | http://localhost:3002  | -           |

## 📋 Essential Commands

### Start/Stop

```bash
./docker.sh start          # Start production
./docker.sh start:dev      # Start development
./docker.sh stop           # Stop all
./docker.sh restart        # Restart all
```

### View Logs

```bash
./docker.sh logs                    # All services
./docker.sh logs:rabbitmq           # RabbitMQ server
./docker.sh logs:rabbitmq-service   # Microservice
./docker.sh logs:backend            # Backend
./docker.sh logs:frontend           # Frontend
```

### Debugging

```bash
./docker.sh status                  # Container status
./docker.sh shell:rabbitmq          # Shell into RabbitMQ
./docker.sh clean                   # Remove everything
```

## 🔧 Configuration Files

| File                                                   | Purpose                   |
| ------------------------------------------------------ | ------------------------- |
| `packages/back-end/micro-service/rabbit-mq/Dockerfile` | Microservice build config |
| `packages/back-end/micro-service/rabbit-mq/.env`       | RabbitMQ connection URL   |
| `docker-compose.yml`                                   | Production orchestration  |
| `docker-compose.dev.yml`                               | Development orchestration |
| `docker.sh`                                            | Helper script             |

## 🏗️ Architecture

```
Frontend (3001) → Backend (3000) → RabbitMQ Service (3002) → RabbitMQ Server (5672)
                                                              ↓
                                                    Management UI (15672)
```

## ⚙️ Key Settings

### RabbitMQ Server

- **Image**: `rabbitmq:3-management-alpine`
- **AMQP Port**: 5672
- **Management Port**: 15672
- **Data Volume**: `rabbitmq-data`
- **Health Check**: `rabbitmq-diagnostics ping`

### RabbitMQ Microservice

- **Port**: 3002
- **Queue**: `chat.general`
- **Prefetch**: 10 messages
- **Connection**: `amqp://guest:guest@rabbitmq:5672`

## 🔒 Security Checklist

Before production deployment:

- [ ] Change RabbitMQ default password
- [ ] Update `.env` file with new credentials
- [ ] Restrict Management UI access (optional)
- [ ] Enable TLS for AMQP connections (optional)
- [ ] Review firewall rules for ports 5672, 15672, 3002

## 🐛 Troubleshooting

### RabbitMQ Not Starting

```bash
docker-compose logs rabbitmq
docker-compose ps rabbitmq
```

### Microservice Can't Connect

```bash
docker-compose exec rabbit-mq-service ping rabbitmq
docker-compose logs rabbit-mq-service
```

### Check Queue Status

Visit: http://localhost:15672 → Queues tab

### Reset Everything

```bash
./docker.sh clean
./docker.sh start
```

## 📊 Monitoring

### RabbitMQ Management UI Features

- Queue monitoring
- Message rates
- Connection status
- Channel details
- Exchange configuration
- User management

### Docker Stats

```bash
docker stats ai-agent-rabbitmq
docker stats ai-agent-rabbitmq-service
```

## 💡 Pro Tips

1. **Development**: Use `docker-compose.dev.yml` for hot-reload support
2. **Logs**: Add `-f` flag to follow logs in real-time
3. **Backup**: Regularly backup `rabbitmq-data` volume
4. **Updates**: Rebuild with `--no-cache` when dependencies change
5. **Network**: All services communicate via `ai-agent-network` bridge

## 📚 Documentation

- Full Guide: `packages/back-end/micro-service/rabbit-mq/DOCKER.md`
- Implementation: `RABBITMQ_DOCKER_SUMMARY.md`
- Main README: `README.md`
- Docker Config: `DOCKER.md`

---

**Need Help?** Check the comprehensive documentation or run `./docker.sh help`
