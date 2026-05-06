# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy .npmrc to ensure proper pnpm workspace behavior
COPY .npmrc ./

# Copy package files
COPY packages/back-end/package.json ./
COPY packages/back-end/pnpm-lock.yaml ./

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile && \
    echo "✅ Dependencies installed successfully" && \
    ls -la node_modules/@nestjs/cli/bin/nest.js

# Copy source code and build
COPY packages/back-end/. .
RUN pnpm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY packages/back-end/package.json ./
COPY packages/back-end/pnpm-lock.yaml ./

# Install production dependencies only (skip prepare scripts)
RUN corepack enable && \
    corepack prepare pnpm@latest --activate && \
    pnpm install --prod --frozen-lockfile --ignore-scripts

# Copy built application
COPY --from=builder /app/dist ./dist

# Create uploads directory for file storage
RUN mkdir -p uploads

EXPOSE 3000

# Start the application
CMD ["pnpm", "run", "start:prod"]