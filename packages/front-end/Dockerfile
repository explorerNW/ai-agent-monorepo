# ======================
# 1. 依赖安装阶段 (Dependencies)
# ======================
FROM node:20-slim AS dependencies

WORKDIR /app

# Enable pnpm with Chinese mirror
RUN corepack enable && \
    corepack prepare pnpm@9.15.0 --activate && \
    npm config set registry https://registry.npmmirror.com

# Copy workspace configuration files
COPY .npmrc ./
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./

# Copy frontend package.json for dependency installation
COPY packages/front-end/package.json ./packages/front-end/package.json

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile


# ======================
# 2. 构建阶段 (Builder)
# ======================
FROM node:20-slim AS builder

WORKDIR /app

# Enable pnpm with Chinese mirror
RUN corepack enable && \
    corepack prepare pnpm@9.15.0 --activate && \
    npm config set registry https://registry.npmmirror.com

# Copy workspace configuration
COPY .npmrc ./
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./

# Copy frontend package.json for dependency installation
COPY packages/front-end/package.json ./packages/front-end/package.json

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile --force && \
    # Verify @react-router/dev is installed
    if [ ! -d "node_modules/@react-router" ]; then \
      echo "ERROR: @react-router not found in root node_modules"; \
      ls -la node_modules/ | head -20; \
      exit 1; \
    fi && \
    echo "✓ @react-router installed successfully"

# Copy source code
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
# Use NODE_PATH to help Node.js resolve modules from workspace root node_modules
RUN NODE_PATH=/app/node_modules node /app/node_modules/@react-router/dev/bin.js build


# ======================
# 3. 生产阶段 - Nginx (Production with Nginx)
# ======================
FROM nginx:alpine AS production

# Add labels for better maintainability
LABEL maintainer="ai-agent-team"
LABEL description="AI Agent Frontend Service"
LABEL version="1.0.0"

# Remove default nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration
COPY packages/front-end/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files from builder
COPY --from=builder /app/packages/front-end/build/client /usr/share/nginx/html

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/ || exit 0

# Start nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
