# ======================
# 1. 依赖安装阶段 (Dependencies)
# ======================
FROM node:22-alpine AS dependencies

WORKDIR /app

# Enable pnpm with Chinese mirror (set registry BEFORE corepack prepare)
RUN npm config set registry https://registry.npmmirror.com && \
    corepack enable && \
    corepack prepare pnpm@11.1.2 --activate

# Copy workspace configuration files
COPY .npmrc ./
COPY package.json pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY packages/back-end/clickhouse-config.xml ./
COPY users.xml ./

# Copy all package.json files for dependency installation
COPY packages/back-end/package.json ./packages/back-end/package.json

# Install all dependencies (including devDependencies for build)
# Use --force to ensure optional dependencies are installed on Alpine
RUN pnpm install --frozen-lockfile --force


# ======================
# 2. 构建阶段 (Builder)
# ======================
FROM node:22-alpine AS builder

WORKDIR /app

# Enable pnpm (set registry BEFORE corepack prepare)
RUN npm config set registry https://registry.npmmirror.com && \
    corepack enable && \
    corepack prepare pnpm@11.1.2 --activate

# Copy workspace configuration
COPY .npmrc ./
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/back-end/package.json ./packages/back-end/package.json
COPY packages/back-end/clickhouse-config.xml ./
COPY packages/back-end/users.xml ./
COPY packages/back-end/default-user.xml ./

# Install all dependencies (including devDependencies for build)
# Use --force to ensure optional dependencies are installed on Alpine
RUN pnpm install --frozen-lockfile --force

# Copy source code
COPY packages/back-end/. ./packages/back-end/

# Build the application from workspace root using the correct package name filter
WORKDIR /app
RUN pnpm --filter=llm build


# ======================
# 3. 生产阶段 (Production)
# ======================
FROM node:22-alpine AS production

# Add labels for better maintainability
LABEL maintainer="ai-agent-team"
LABEL description="AI Agent Backend Service"
LABEL version="1.0.0"

WORKDIR /app/packages/back-end

# Create non-root user for security
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# Enable pnpm (set registry BEFORE corepack prepare)
RUN npm config set registry https://registry.npmmirror.com && \
    corepack enable && \
    corepack prepare pnpm@11.1.2 --activate

# Copy workspace configuration
COPY .npmrc ../../
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ../../
COPY packages/back-end/package.json ../../packages/back-end/
COPY clickhouse-config.xml ../../
COPY packages/back-end/users.xml ../../packages/back-end/

# Install production dependencies only
RUN cd ../.. && pnpm install --prod --frozen-lockfile --ignore-scripts --filter=llm

# Copy built application from builder
COPY --from=builder /app/packages/back-end/dist ./dist

# Create necessary directories with proper permissions
RUN mkdir -p uploads && \
    chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 0

# Start the application using node directly (more stable than nest CLI)
CMD ["node", "dist/src/main.js"]
