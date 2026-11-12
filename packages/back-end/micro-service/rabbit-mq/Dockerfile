# syntax=docker/dockerfile:1

# ===================== Base =====================
FROM node:22-alpine AS base

ARG NPM_REGISTRY=https://registry.npmmirror.com
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    COREPACK_NPM_REGISTRY=${NPM_REGISTRY} \
    PNPM_HOME="/pnpm" \
    PATH="$PNPM_HOME:/pnpm/bin:$PATH"

# 固定 store-dir + 固定 pnpm 版本，避免每次下载 binary、跨阶段错位
# 注意：id 用 pnpm-store-rabbitmq，与 back-end 区分，避免共享同一缓存卷
RUN --mount=type=cache,id=corepack-rabbitmq,target=/root/.cache/node/corepack \
    corepack enable && \
    corepack prepare pnpm@12.4.1 --activate && \
    pnpm config set store-dir /pnpm/store && \
    pnpm config set registry ${NPM_REGISTRY}

WORKDIR /app

# ============ Manifests（只放依赖清单，命中层缓存的关键层）============
FROM base AS manifests

# 根 + 所有 workspace 成员的 package.json 都要拷，否则 --frozen-lockfile 校验 importers 失败
# 稳妥做法：用 .dockerignore 反向控制，或用下面显式列举 + COPY --parents
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY --parents \
     packages/back-end/package.json \
     packages/front-end/package.json \
     packages/back-end/micro-service/rabbit-mq/package.json \
     ./

# ============ Prod deps：只依赖 manifest，源码再变也不重跑 ============
FROM manifests AS prod-deps

RUN --mount=type=cache,id=pnpm-store-rabbitmq,target=/pnpm/store \
    pnpm install --frozen-lockfile --prod --ignore-scripts \
      --filter=./packages/back-end/micro-service/rabbit-mq... \
      --prefer-offline && \
    pnpm deploy --filter=./packages/back-end/micro-service/rabbit-mq \
      --prod --legacy /deploy

# ============ Build deps：开发依赖，用于 tsc ============
FROM manifests AS build-deps

# 🔑 只安装 rabbit-mq 及其依赖（...表示包含传递依赖），不装整个 monorepo
RUN --mount=type=cache,id=pnpm-store-rabbitmq,target=/pnpm/store \
    pnpm install --frozen-lockfile --prod=false --ignore-scripts --prefer-offline \
      --filter=./packages/back-end/micro-service/rabbit-mq...

# ============ Builder：源码最后才拷，改源码只击穿 build，不碰 install ============
FROM build-deps AS builder

# 🔑 只拷贝 rabbit-mq 源码，不拷贝整个 monorepo
COPY packages/back-end/micro-service/rabbit-mq/ ./packages/back-end/micro-service/rabbit-mq/

WORKDIR /app/packages/back-end/micro-service/rabbit-mq
RUN pnpm exec tsc -p tsconfig.build.json

# ===================== Production =====================
FROM node:22-alpine AS production

ENV NODE_ENV=production \
    PNPM_HOME="/pnpm" \
    PATH="$PNPM_HOME:/pnpm/bin:$PATH"

WORKDIR /app

# 🔑 先创建用户
RUN addgroup -g 1001 -S app && adduser -S app -u 1001 -G app

# 🔑 用 --chown 替代 chown -R
COPY --from=prod-deps --chown=app:app /deploy ./
COPY --from=builder --chown=app:app /app/packages/back-end/micro-service/rabbit-mq/dist ./dist

USER app

EXPOSE 3002
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:3002/health || exit 1
CMD ["node", "dist/src/main.js"]