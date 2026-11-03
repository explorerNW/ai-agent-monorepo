# ======================
# Builder Stage
# ======================
FROM node:22-alpine AS builder

WORKDIR /app

ENV NODE_ENV=development
ENV COREPACK_NPM_REGISTRY=http://192.168.88.118:4873
## https://registry.npmmirror.com

RUN npm install -g pnpm@latest

# 先复制依赖描述文件，利用 Docker 层缓存
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/back-end/micro-service/rabbit-mq/package.json ./packages/back-end/micro-service/rabbit-mq/

# 🔑 使用 BuildKit cache mount，即使 lock 文件变了也能复用已下载的包
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prod=false --ignore-scripts

# 再复制源码
COPY packages/back-end/micro-service/rabbit-mq/ ./packages/back-end/micro-service/rabbit-mq/

WORKDIR /app/packages/back-end/micro-service/rabbit-mq
RUN npx tsc -p tsconfig.build.json || npx tsc -p tsconfig.json


# ======================
# Production Stage
# ======================
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV COREPACK_NPM_REGISTRY=https://registry.npmmirror.com

RUN npm install -g pnpm@latest

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/back-end/micro-service/rabbit-mq/package.json ./packages/back-end/micro-service/rabbit-mq/

RUN pnpm install --frozen-lockfile --prod --ignore-scripts

COPY --from=builder \
  /app/packages/back-end/micro-service/rabbit-mq/dist \
  /app/packages/back-end/micro-service/rabbit-mq/dist

WORKDIR /app/packages/back-end/micro-service/rabbit-mq

EXPOSE 3002

CMD ["node", "dist/src/main.js"]
