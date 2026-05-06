# Stage 1: Install development dependencies
FROM node:20-alpine AS development-dependencies-env

WORKDIR /app

# Copy package files
COPY packages/front-end/package.json ./
COPY packages/front-end/pnpm-lock.yaml ./

# Install all dependencies
RUN corepack enable && \
    corepack prepare pnpm@latest --activate && \
    pnpm install --frozen-lockfile

# Stage 2: Install production dependencies only
FROM node:20-alpine AS production-dependencies-env

WORKDIR /app

# Copy package files
COPY packages/front-end/package.json ./
COPY packages/front-end/pnpm-lock.yaml ./

# Install production dependencies only (skip prepare scripts)
RUN corepack enable && \
    corepack prepare pnpm@latest --activate && \
    pnpm install --prod --frozen-lockfile --ignore-scripts

# Stage 3: Build the application
FROM node:20-alpine AS build-env

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy all source code
COPY packages/front-end/. .

# Copy node_modules from development stage
COPY --from=development-dependencies-env /app/node_modules ./node_modules

# Accept build arguments for environment variables
ARG VITE_API_BASE_URL
ARG VITE_APP_NAME
ARG VITE_APP_VERSION

# Set environment variables for build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_APP_VERSION=$VITE_APP_VERSION

# Build the front-end application
RUN pnpm run build

# Stage 4: Production runtime
FROM node:20-alpine

WORKDIR /app

# Install pnpm for running the application
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY packages/front-end/package.json ./
COPY packages/front-end/pnpm-lock.yaml ./

# Copy production dependencies
COPY --from=production-dependencies-env /app/node_modules ./node_modules

# Copy built application
COPY --from=build-env /app/build ./build

EXPOSE 3001

CMD ["pnpm", "run", "start"]