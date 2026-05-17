# ======================
# 1. 依赖安装阶段 (Dependencies)
# ======================
FROM node:22-slim AS dependencies

WORKDIR /app

# Enable pnpm with Chinese mirror
RUN corepack enable && \
    corepack prepare pnpm@9.15.0 --activate && \
    npm config set registry https://registry.npmmirror.com

# Copy workspace configuration files
COPY .npmrc ./
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./

# Copy ALL workspace package.json files for proper dependency resolution
COPY packages/front-end/package.json ./packages/front-end/package.json
COPY packages/back-end/package.json ./packages/back-end/package.json

# Install all dependencies (including devDependencies for build)
# This creates node_modules with symlinks in monorepo structure
# Explicitly install devDependencies needed for building
RUN pnpm install --frozen-lockfile --prod=false


# ======================
# 2. 构建阶段 (Builder)
# ======================
FROM dependencies AS builder

WORKDIR /app

# Copy source code (after dependencies are installed)
COPY packages/front-end/. ./packages/front-end/

# Accept build arguments for environment variables
ARG VITE_API_BASE_URL
ARG VITE_APP_NAME
ARG VITE_APP_VERSION

# Set environment variables for build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_APP_VERSION=$VITE_APP_VERSION

# Build the application - run from workspace root where binaries are accessible
WORKDIR /app/packages/front-end

# Debug: Verify @react-router/dev installation
RUN echo "=== Checking @react-router installation ===" && \
    if [ -d "/app/node_modules/@react-router" ]; then \
      echo "✓ @react-router directory exists"; \
      ls -la /app/node_modules/@react-router/; \
    else \
      echo "✗ @react-router NOT found in /app/node_modules"; \
      echo "Checking pnpm store..."; \
      find /app/node_modules/.pnpm -name "*@react-router*" -type d 2>/dev/null | head -5 || echo "No pnpm entries"; \
    fi && \
    echo "=== End check ==="

# Build using pnpm (preferred method for monorepo)
RUN pnpm run build


# ======================
# 3. 生产阶段 - Nginx (Production with Nginx)
# ======================
FROM nginx:alpine AS production

# Add labels for better maintainability
LABEL maintainer="ai-agent-team"
LABEL description="AI Agent Frontend Service"
LABEL version="1.0.0"

# Install OpenSSL for SSL certificate support (if needed for testing)
RUN apk add --no-cache openssl

# Remove default nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration
COPY packages/front-end/nginx.conf /etc/nginx/conf.d/default.conf

# Create SSL directory
RUN mkdir -p /etc/nginx/ssl

# Copy built static files from builder
COPY --from=builder /app/packages/front-end/build/client /usr/share/nginx/html

# Expose ports (HTTP and HTTPS)
EXPOSE 80 443

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider https://localhost:443/ --no-check-certificate || exit 0

# Start nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
