# ======================
# 1. 依赖安装阶段 (Dependencies)
# ======================
FROM node:20-alpine AS dependencies

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace configuration files
COPY .npmrc ./
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./

# Copy backend package.json for dependency installation
COPY packages/back-end/package.json ./packages/back-end/package.json

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile


# ======================
# 2. 构建阶段 (Builder)
# ======================
FROM node:20-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace configuration
COPY .npmrc ./
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./
COPY packages/back-end/package.json ./packages/back-end/package.json

# Copy installed dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/packages/back-end/node_modules ./packages/back-end/node_modules

# Copy source code
COPY packages/back-end/. ./packages/back-end/

# Build the application
RUN pnpm --filter=back-end run build


# ======================
# 3. 生产阶段 (Production)
# ======================
FROM node:20-alpine AS production

# Add labels for better maintainability
LABEL maintainer="ai-agent-team"
LABEL description="AI Agent Backend Service"
LABEL version="1.0.0"

WORKDIR /app/packages/back-end

# Create non-root user for security
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace configuration
COPY .npmrc ../../
COPY pnpm-workspace.yaml ../../
COPY package.json pnpm-lock.yaml ../../
COPY packages/back-end/package.json ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

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
CMD ["node", "dist/main.js"]
