# syntax=docker/dockerfile:1
FROM node:22-alpine AS base
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    COREPACK_NPM_REGISTRY=https://registry.npmmirror.com
    #http://192.168.88.118:4873
# 尊重 package.json 里的 packageManager，不再 npm -g 装 latest
RUN corepack enable
WORKDIR /app

# ============ Builder ============
FROM base AS builder
ENV NODE_ENV=development
COPY . .
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts --prefer-offline
RUN pnpm --filter=llm build

# ============ Production ============
FROM base AS production
LABEL maintainer="ai-agent-team" description="AI Agent Backend Service" version="2.0.0"
ENV NODE_ENV=production
COPY . .
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prod --ignore-scripts \
      --filter=llm... --prefer-offline

# 产物 + 运行时文件（保持 packages/back-end 目录结构，路径最省改动）
COPY --from=builder /app/packages/back-end/dist ./packages/back-end/dist
COPY --from=builder /app/packages/back-end/src/redis/scripts/seckill.lua \
     ./packages/back-end/dist/src/redis/scripts/seckill.lua
COPY packages/back-end/clickhouse-config.xml packages/back-end/users.xml \
     ./packages/back-end/

RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001 -G appgroup && \
    mkdir -p packages/back-end/uploads && chown -R appuser:appgroup /app

WORKDIR /app/packages/back-end
USER appuser
EXPOSE 3000
# 关键：失败要 exit 1，不能 exit 0
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/parallel/cpu-info || exit 1
CMD ["node", "dist/src/main.js"]