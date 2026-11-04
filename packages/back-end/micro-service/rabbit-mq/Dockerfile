# syntax=docker/dockerfile:1
FROM node:22-alpine AS base
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    COREPACK_NPM_REGISTRY=https://registry.npmmirror.com
    #http://192.168.88.118:4873
RUN corepack enable
WORKDIR /app

# ===================== Builder =====================
FROM base AS builder
ENV NODE_ENV=development
COPY . .
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prod=false --ignore-scripts --prefer-offline
WORKDIR /app/packages/back-end/micro-service/rabbit-mq
RUN pnpm exec tsc -p tsconfig.build.json

# ===================== Production =====================
FROM base AS production
ENV NODE_ENV=production
COPY . .
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prod --ignore-scripts \
      --filter rabbit-mq... --prefer-offline && \
    pnpm deploy --filter=rabbit-mq --prod --legacy /app/deploy

# 把 builder 编译好的产物放进 deploy（deploy 只拍平依赖，不含 dist）
COPY --from=builder \
     /app/packages/back-end/micro-service/rabbit-mq/dist \
     /app/deploy/dist

WORKDIR /app/deploy
USER node
EXPOSE 3002
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:3002/health || exit 1
CMD ["node", "dist/src/main.js"]