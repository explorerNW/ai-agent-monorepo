# ======================
# 1. 依赖安装阶段 (Dependencies)
# ======================
FROM node:22-alpine AS dependencies

WORKDIR /app

# Enable pnpm with Chinese mirror
RUN corepack enable && \
    corepack prepare pnpm@latest --activate && \
    npm config set registry https://registry.npmmirror.com

# Copy package files
COPY .npmrc ./
COPY package.json ./

# Install all dependencies (including devDependencies for build)
# Ignore scripts to avoid approval issues on Alpine
RUN pnpm install --ignore-scripts


# ======================
# 2. 构建阶段 (Builder)
# ======================
FROM node:22-alpine AS builder

WORKDIR /app

# Enable pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace configuration
COPY .npmrc ./
COPY package.json ./

# Install all dependencies (including devDependencies for build)
RUN pnpm install --ignore-scripts

# Copy source code
COPY src/ ./src/
COPY tsconfig.json tsconfig.build.json nest-cli.json ./

# Build the application
RUN pnpm build


# ======================
# 3. 生产阶段 (Production)
# ======================
FROM node:22-alpine AS production

# Add labels for better maintainability
LABEL maintainer="ai-agent-team"
LABEL description="MCP Server Microservice"
LABEL version="1.0.0"

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# Enable pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace configuration
COPY .npmrc ./
COPY package.json ./

# Install production dependencies only
RUN pnpm install --prod --ignore-scripts

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Set proper permissions
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# No EXPOSE needed - TCP microservice doesn't listen on HTTP port
# No HEALTHCHECK needed - pure microservice consumer, relies on restart policy

# Start the application using node directly (more stable than nest CLI)
CMD ["node", "dist/main.js"]
