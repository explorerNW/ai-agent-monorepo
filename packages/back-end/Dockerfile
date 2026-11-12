# ======================
# 1. Base + Manifests（依赖清单，命中层缓存的关键层）
# ======================
FROM node:22-alpine AS base

WORKDIR /app

# Copy workspace configuration
COPY .npmrc ./
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy all workspace package.json — pnpm --frozen-lockfile 需要校验所有 importers
COPY packages/back-end/package.json ./packages/back-end/package.json
COPY packages/back-end/micro-service/rabbit-mq/package.json ./packages/back-end/micro-service/rabbit-mq/package.json
COPY packages/front-end/package.json ./packages/front-end/package.json
COPY packages/monitor-sdk/package.json ./packages/monitor-sdk/package.json
COPY packages/datatwin-core/package.json ./packages/datatwin-core/package.json
COPY packages/datatwin-react/package.json ./packages/datatwin-react/package.json
COPY packages/datatwin-chart-core/package.json ./packages/datatwin-chart-core/package.json
COPY packages/datatwin-chart-react/package.json ./packages/datatwin-chart-react/package.json
COPY packages/datatwin-chart-element/package.json ./packages/datatwin-chart-element/package.json
COPY packages/datatwin-elements/package.json ./packages/datatwin-elements/package.json

ARG NPM_REGISTRY=https://registry.npmmirror.com
RUN npm config set registry ${NPM_REGISTRY} && \
    corepack enable && corepack prepare pnpm@11.1.2 --activate && \
    pnpm config set store-dir /root/.local/share/pnpm/store

# ======================
# 2. Build deps（含 devDependencies，用于构建）
# ======================
FROM base AS build-deps

RUN --mount=type=cache,id=pnpm-store-backend,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prod=false --ignore-scripts

# ======================
# 3. Prod deps + deploy（生成干净生产产物）
# ======================
FROM base AS prod-deps

RUN --mount=type=cache,id=pnpm-store-backend,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prod --ignore-scripts && \
    pnpm deploy --filter=llm --prod --legacy /deploy

# ======================
# 4. Builder（源码最后才拷，改一行 log 只失效这一层）
# ======================
FROM build-deps AS builder

# 🔑 最后才复制源码 — 改一行 log 只失效这一层，install 层缓存不受影响
COPY packages/back-end/. ./packages/back-end/

# Build the application
WORKDIR /app
RUN pnpm --filter=llm build


# ======================
# 5. Production（直接用 deploy 产物，不再重复 install）
# ======================
FROM node:22-alpine AS production

LABEL maintainer="ai-agent-team"
LABEL description="AI Agent Backend Service"
LABEL version="1.0.0"

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# 直接拿 prod-deps 的 deploy 产物（含裁剪后的 node_modules + package.json）
COPY --from=prod-deps /deploy ./

# 编译产物覆盖进去
COPY --from=builder /app/packages/back-end/dist ./dist
COPY --from=builder /app/packages/back-end/src/redis/scripts/seckill.lua ./dist/src/redis/scripts/seckill.lua

# Create necessary directories with proper permissions
RUN mkdir -p uploads && \
    chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 0

CMD ["node", "dist/src/main.js"]
