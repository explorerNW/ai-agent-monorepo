# ======================
# 1. 构建阶段 (Builder) - 合并依赖安装 + 编译
# ======================
FROM node:22-alpine AS builder

WORKDIR /app

ENV COREPACK_NPM_REGISTRY=https://registry.npmmirror.com

RUN npm install -g pnpm@11.1.2

# 先复制依赖描述文件，利用 Docker 层缓存
COPY .npmrc ./
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/back-end/package.json ./packages/back-end/package.json

# 一次性安装全部依赖（含 devDependencies，构建需要）
RUN pnpm install --frozen-lockfile --ignore-scripts

# 再复制源码（依赖不变时上面的 install 层走缓存）
COPY packages/back-end/clickhouse-config.xml ./packages/back-end/
COPY packages/back-end/users.xml ./packages/back-end/
COPY packages/back-end/default-user.xml ./packages/back-end/
COPY packages/back-end/. ./packages/back-end/

# 编译
WORKDIR /app
RUN pnpm --filter=llm build


# ======================
# 2. 生产阶段 (Production)
# ======================
FROM node:22-alpine AS production

LABEL maintainer="ai-agent-team"
LABEL description="AI Agent Backend Service"
LABEL version="2.0.0"

WORKDIR /app

ENV COREPACK_NPM_REGISTRY=https://registry.npmmirror.com
ENV NODE_ENV=production

RUN npm install -g pnpm@11.1.2 && \
    addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# 复制依赖描述文件
COPY .npmrc ./
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/back-end/package.json ./packages/back-end/package.json

# 只安装生产依赖，跳过 lifecycle 脚本
RUN pnpm install --prod --frozen-lockfile --ignore-scripts --filter=llm

# 复制构建产物
COPY --from=builder /app/packages/back-end/dist ./packages/back-end/dist
COPY --from=builder /app/packages/back-end/src/redis/scripts/seckill.lua ./packages/back-end/dist/src/redis/scripts/seckill.lua

# 复制运行时需要的配置
COPY packages/back-end/clickhouse-config.xml ./packages/back-end/
COPY packages/back-end/users.xml ./packages/back-end/

RUN mkdir -p packages/back-end/uploads && \
    chown -R appuser:appgroup /app

WORKDIR /app/packages/back-end
USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/parallel/cpu-info || exit 0

CMD ["node", "dist/src/main.js"]
