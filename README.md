# AI Agent Monorepo

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-green.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-11.1.2-orange.svg)](https://pnpm.io/)
[![Docker](https://img.shields.io/badge/docker-compose-ready-blue.svg)](https://docs.docker.com/compose/)

A production-ready monorepo combining **AI-powered services** with **real-time performance monitoring**. Built with NestJS backend, React frontend, LangChain integration, RabbitMQ microservices, and comprehensive Web Vitals tracking.

## 🌟 Key Features

- 🤖 **AI Chat Interface**: Streaming conversations with Qwen (DashScope) via LangChain
- 📊 **Performance Monitoring**: Real-time Web Vitals collection and analytics dashboard
- ⚡ **Parallel Task Processing**: CPU-optimized concurrent execution for heavy workloads
- 🔍 **Automated Code Review**: AI-assisted PR reviews with GitHub webhook integration
- 📄 **PDF & OCR Processing**: Document analysis with Tesseract.js integration
- 📨 **Async Message Queue**: RabbitMQ microservice for background task processing
- 🐳 **Docker-Ready**: Production-grade containerization with health checks and auto-scaling
- 🎯 **Type-Safe**: Full TypeScript coverage across frontend and backend

## 📚 Documentation

- **[Architecture Guide](./ARCHITECTURE.md)** - Comprehensive system architecture, data flows, and deployment strategies
- **[Docker Setup](./DOCKER.md)** - Container deployment instructions and configuration
- **[HTTPS Setup](./HTTPS_SETUP.md)** - Self-signed SSL certificates and HTTPS configuration
- **[Git Workflow](./GIT_WORKFLOW.md)** - Commit conventions and development workflow
- **[Backend Docs](./packages/back-end/README.md)** - API endpoints and service documentation
- **[Frontend Docs](./packages/front-end/README.md)** - UI components and routing guide
- **[RabbitMQ Microservice](./packages/back-end/micro-service/rabbit-mq/DOCKER.md)** - Message queue setup

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (LTS recommended)
- pnpm 11+
- Docker & Docker Compose (for containerized dependencies)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd ai-agent-monorepo

# Install dependencies (auto-installs Husky hooks)
pnpm install

# Copy environment files
cp packages/back-end/.env.example packages/back-end/.env
cp packages/front-end/.env.example packages/front-end/.env

# Edit .env files with your configuration
# Required: DASHSCOPE_API_KEY for AI features
```

### Local Development

**Option 1: Run Services Locally (Recommended for Active Development)**

```bash
# Terminal 1: Start backend (with hot-reload)
pnpm start:server

# Terminal 2: Start frontend (Vite dev server)
pnpm start:ui

# Terminal 3 (optional): Start RabbitMQ microservice
pnpm start:micro:rabbit-mq
```

**Access Points**:

- 🌐 Frontend: http://localhost:5173
- 🔌 Backend API: http://localhost:3000
- 🐰 RabbitMQ Management: http://localhost:15672 (guest/guest)

**Option 2: Docker Development**

```bash
# Start all services in containers
./docker.sh start:dev

# Or using docker-compose directly
docker-compose -f docker-compose.dev.yml up -d --build
```

**Access Points**:

- 🌐 Frontend: http://localhost:3001
- 🔌 Backend API: http://localhost:3000
- 🐰 RabbitMQ Management: http://localhost:15672 (guest/guest)

### Production Deployment

**Standard HTTP Deployment:**

```bash
# Build and start all services
docker-compose up -d --build

# Check service status
./docker.sh status

# View logs
./docker.sh logs

# Stop all services
./docker.sh stop
```

**HTTPS Deployment (Recommended for Production):**

For secure HTTPS access with SSL certificates:

```bash
# Quick setup (automated)
./setup-https.sh

# Or manual setup:
# 1. Generate self-signed certificates
./generate-ssl-cert.sh

# 2. Build and start with HTTPS
docker-compose up -d --build

# Access via HTTPS
# Frontend: https://localhost
# Backend API: https://localhost/api/
```

📖 See **[HTTPS Setup Guide](./HTTPS_SETUP.md)** for detailed instructions on:

- Generating and trusting self-signed certificates
- Configuring nginx for SSL termination
- Setting up reverse proxy to backend
- Troubleshooting common issues

## 📦 Project Structure

```
ai-agent-monorepo/
├── packages/
│   ├── back-end/                      # NestJS Backend (Port 3000)
│   │   ├── src/
│   │   │   ├── ai-qwen/              # AI chat service (LangChain + Qwen)
│   │   │   ├── analysis/             # Analytics & Web Vitals tracking
│   │   │   ├── code-review/          # Automated PR review
│   │   │   ├── parallel-task/        # Concurrent task execution
│   │   │   ├── pdf-process/          # PDF document processing
│   │   │   └── tesseract/            # OCR service
│   │   └── micro-service/
│   │       └── rabbit-mq/            # RabbitMQ message consumer
│   │
│   └── front-end/                     # React Frontend (Port 3001/5173)
│       ├── app/
│       │   ├── components/           # Reusable UI components
│       │   ├── core/                 # Analytics SDK & utilities
│       │   ├── routes/               # Page components
│       │   │   ├── Chat.tsx          # AI chat interface
│       │   │   ├── analytics.tsx     # Performance dashboard
│       │   │   └── home.tsx          # Landing page
│       │   └── hooks/                # Custom React hooks
│       └── Dockerfile
│
├── docker-compose.yml                # Production deployment
├── docker-compose.dev.yml            # Development deployment
├── ARCHITECTURE.md                   # System architecture guide
└── DOCKER.md                         # Docker setup instructions
```

## 🛠️ Technology Stack

### Backend

- **Framework**: NestJS 11 with TypeScript 5.7
- **Database**: PostgreSQL 16 with TypeORM
- **AI/ML**: LangChain 1.2 with DashScope (Qwen) integration
- **Message Queue**: RabbitMQ 4 with amqplib
- **OCR**: Tesseract.js 7.0
- **PDF**: pdf-lib, pdf2pic

### Frontend

- **Framework**: React 19 with React Router 7
- **Build Tool**: Vite 8
- **Styling**: TailwindCSS 4
- **Charts**: ECharts 5.5
- **Analytics**: Custom SDK with Web Vitals API

### DevOps

- **Container**: Docker & Docker Compose
- **Package Manager**: pnpm workspaces
- **Git Hooks**: Husky 9 + lint-staged
- **Commit Linting**: Commitlint with conventional commits

## 📋 Available Scripts

### Development

```bash
pnpm start:server          # Start backend with hot-reload
pnpm start:ui              # Start frontend dev server
pnpm start:micro:rabbit-mq # Start RabbitMQ microservice
```

### Building

```bash
pnpm build                 # Build all packages
pnpm build:micro:rabbit-mq # Build RabbitMQ microservice only
pnpm build:all-micro       # Build all microservices
```

### Docker Management

```bash
pnpm docker:start          # Start production containers
pnpm docker:start:dev      # Start development containers
pnpm docker:stop           # Stop all containers
pnpm docker:restart        # Restart all containers
pnpm docker:logs           # View container logs
pnpm docker:build          # Rebuild images
pnpm docker:clean          # Remove containers and volumes
pnpm docker:status         # Check service health
```

### Code Quality

```bash
pnpm lint                  # Lint all packages
pnpm format                # Format all packages
pnpm commitlint            # Validate commit messages
```

## 🔧 Configuration

### Environment Variables

**Backend** (`packages/back-end/.env`):

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=admin123
DB_NAME=analytics

# AI Services
DASHSCOPE_API_KEY=your_api_key_here
AI_MODEL_NAME=qwen-turbo

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672
RABBITMQ_USER=guest
RABBITMQ_PASS=guest
RABBITMQ_HOST=rabbitmq

# Application
NODE_ENV=development
PORT=3000
FRONT_END_URL=http://localhost:5173
FRONT_END_URL_DEV=http://localhost:5173
```

**Frontend** (`packages/front-end/.env`):

```bash
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_NAME=AI Assistant
VITE_APP_VERSION=1.0.0
VITE_ENABLE_STREAMING=true
VITE_ENABLE_FILE_UPLOAD=false
VITE_DEBUG_MODE=false
```

See [ENV_VARIABLES.md](./packages/front-end/ENV_VARIABLES.md) for complete reference.

## 🧪 Testing

```bash
# Backend unit tests
pnpm -F llm test

# Backend E2E tests
pnpm -F llm test:e2e

# Test coverage
pnpm -F llm test:cov

# Frontend type checking
pnpm -F my-app typecheck
```

## 📊 Monitoring & Observability

### Health Checks

All services implement health checks for automatic recovery:

- **PostgreSQL**: `pg_isready` check every 10s
- **RabbitMQ**: `rabbitmq-diagnostics ping` every 30s
- **Backend**: HTTP endpoint `/parallel/cpu-info` every 30s
- **Frontend**: HTTP root check every 30s

### Performance Metrics

The application tracks Core Web Vitals automatically:

- **LCP** (Largest Contentful Paint): Loading performance
- **FCP** (First Contentful Paint): Initial render time
- **CLS** (Cumulative Layout Shift): Visual stability
- **FID** (First Input Delay): Interactivity responsiveness
- **TTFB** (Time to First Byte): Server response time

View metrics at: http://localhost:3001/analytics

### Logs

```bash
# View all service logs
./docker.sh logs

# Follow specific service logs
docker logs -f ai-agent-backend
docker logs -f ai-agent-frontend
docker logs -f ai-agent-rabbitmq
```

## 🔐 Security

- ✅ Environment variables for sensitive data (never committed)
- ✅ CORS protection configured for specific origins
- ✅ Input validation with class-validator DTOs
- ✅ SQL injection prevention via TypeORM parameterized queries
- ✅ Rate limiting planned (TODO)
- ✅ HTTPS support via reverse proxy (nginx)

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feat/amazing-feature`)
3. **Commit** using conventional commits (`git commit -m 'feat: add amazing feature'`)
4. **Push** to your branch (`git push origin feat/amazing-feature`)
5. **Open** a Pull Request

### Commit Message Format

This project enforces [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

**Examples**:

```bash
git commit -m "feat(analytics): add Web Vitals tracking"
git commit -m "fix(rabbitmq): resolve queue durability issue"
git commit -m "docs(readme): update architecture diagram"
```

Pre-commit hooks automatically enforce code formatting and linting.

## 📈 Performance Optimization

### Backend

- Connection pooling via TypeORM
- Parallel task execution (75% CPU utilization)
- Gzip compression for responses
- Query optimization with indexes

### Frontend

- Code splitting via React Router
- Lazy loading for routes and components
- Bundle optimization with Vite
- Image optimization and lazy loading

### Database

- Strategic indexing on frequently queried columns
- JSONB storage for flexible metrics
- Time-series optimized queries
- Regular vacuum and analyze

## 🐛 Troubleshooting

### Common Issues

**Database Connection Failed**:

```bash
docker ps | grep postgres
docker logs ai-agent-postgres
docker-compose restart postgres
```

**RabbitMQ Connection Refused**:

```bash
docker logs ai-agent-rabbitmq
docker exec -it ai-agent-rabbitmq rabbitmqctl status
docker-compose restart rabbitmq
```

**Frontend Cannot Reach Backend**:

- Verify `VITE_API_BASE_URL` in `.env`
- Check CORS configuration in `main.ts`
- Ensure backend is running on port 3000

**High Memory Usage**:

- Increase container limits in `docker-compose.yml`
- Profile backend: `node --inspect`
- Reduce concurrency in parallel tasks

See [ARCHITECTURE.md](./ARCHITECTURE.md#troubleshooting-guide) for detailed debugging instructions.

## 🗺️ Roadmap

### Short-Term (1-3 months)

- [ ] Redis caching layer
- [ ] API rate limiting
- [ ] WebSocket real-time updates
- [ ] Sentry error tracking
- [ ] Comprehensive E2E tests

### Medium-Term (3-6 months)

- [ ] Kubernetes migration
- [ ] CI/CD pipeline with GitHub Actions
- [ ] GraphQL API
- [ ] User authentication (JWT)
- [ ] Internationalization (i18n)

### Long-Term (6-12 months)

- [ ] Microservices decomposition
- [ ] Event sourcing for analytics
- [ ] ML model training pipeline
- [ ] Mobile app (React Native)
- [ ] Advanced AI features (RAG, fine-tuning)

## 📄 License

This project is licensed under the ISC License. See [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [LangChain](https://js.langchain.com/) - LLM orchestration framework
- [React Router](https://reactrouter.com/) - Declarative routing
- [RabbitMQ](https://www.rabbitmq.com/) - Message broker
- [Web Vitals](https://web.dev/vitals/) - Performance metrics

---

**Built with ❤️ by the AI Agent Team**

For detailed architecture information, see [ARCHITECTURE.md](./ARCHITECTURE.md).
