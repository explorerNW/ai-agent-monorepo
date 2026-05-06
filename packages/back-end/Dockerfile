# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY packages/back-end/package.json ./
COPY packages/back-end/pnpm-lock.yaml ./

# Install all dependencies
RUN corepack enable && \
    corepack prepare pnpm@latest --activate && \
    pnpm install --frozen-lockfile

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