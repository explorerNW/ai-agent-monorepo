# AI Agent Monorepo

A monorepo for LangChain Graph with NestJS backend and React frontend, featuring automated Git commit workflow control and RabbitMQ microservice architecture.

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
pnpm install

# Start backend server
pnpm start:server

# Start frontend UI
pnpm start:ui

# Build all packages
pnpm build
```

### Docker Deployment

For containerized deployment, see [DOCKER.md](./DOCKER.md) for detailed instructions.

**Quick start with Docker:**

```bash
# Production mode (includes RabbitMQ microservice)
docker-compose up -d --build

# Development mode (with hot-reload)
docker-compose -f docker-compose.dev.yml up -d --build
```

Access the application:

- **Front-end**: http://localhost:3001 (production) or http://localhost:5173 (development)
- **Back-end API**: http://localhost:3000
- **RabbitMQ Management UI**: http://localhost:15672 (guest/guest)
- **RabbitMQ Microservice**: http://localhost:3002

## 📋 Git Commit Workflow

This project uses **Husky** and **lint-staged** to enforce code quality and commit message standards.

### Features

- ✅ **Pre-commit hooks**: Automatically lint and format staged files
- ✅ **Commit message validation**: Enforces [Conventional Commits](https://www.conventionalcommits.org/) specification
- ✅ **Automated setup**: Hooks are installed automatically via `pnpm install`

### Commit Message Format

Use conventional commits format:

```bash
git commit -m "feat: add new feature"
git commit -m "fix: resolve bug in module"
git commit -m "docs: update documentation"
```

**Allowed types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

For detailed information, see [GIT_WORKFLOW.md](./GIT_WORKFLOW.md).

## 📦 Project Structure

```
ai-agent-monorepo/
├── packages/
│   ├── back-end/              # NestJS backend with LangChain integration
│   │   └── micro-service/
│   │       └── rabbit-mq/     # RabbitMQ microservice
│   └── front-end/             # React frontend with Vite
├── .husky/                    # Git hooks configuration
├── .lintstagedrc.json         # Lint-staged configuration
└── commitlint.config.js       # Commit message validation rules
```

## 🛠️ Development

See individual package README files for more details:

- [Backend Documentation](./packages/back-end/README.md)
- [Frontend Documentation](./packages/front-end/README.md)
- [RabbitMQ Microservice](./packages/back-end/micro-service/rabbit-mq/DOCKER.md)

## 📚 Learn More

- [Git Workflow Guide](./GIT_WORKFLOW.md)
- [Docker Configuration](./DOCKER.md)
- [RabbitMQ Microservice Setup](./packages/back-end/micro-service/rabbit-mq/DOCKER.md)
- [Husky Documentation](https://typicode.github.io/husky/)
- [Conventional Commits](https://www.conventionalcommits.org/)
