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
    corepack prepare pnpm@latest --activate && \
    pnpm config set store-dir /pnpm/store

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

RUN --mount=type=cache,id=pnpm-store-rabbitmq,target=/pnpm/store \
    pnpm install --frozen-lockfile --prod=false --ignore-scripts --prefer-offline

# ============ Builder：源码最后才拷，改源码只击穿 build，不碰 install ============
FROM build-deps AS builder

COPY . .                          
WORKDIR /app/packages/back-end/micro-service/rabbit-mq
RUN pnpm exec tsc -p tsconfig.build.json

# ===================== Production =====================
FROM node:22-alpine AS production

ENV NODE_ENV=production \
    PNPM_HOME="/pnpm" \
    PATH="$PNPM_HOME:/pnpm/bin:$PATH"

WORKDIR /app

# 直接拿 prod 的 deploy 产物（含裁剪后的 node_modules + package.json）
COPY --from=prod-deps /deploy ./
# 编译产物覆盖进去（源码变更只走到这里，install 不再重跑）
COPY --from=builder /app/packages/back-end/micro-service/rabbit-mq/dist ./dist

RUN addgroup -g 1001 -S app && adduser -S app -u 1001 -G app && chown -R app:app /app
USER app

EXPOSE 3002
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:3002/health || exit 1
CMD ["node", "dist/src/main.js"]