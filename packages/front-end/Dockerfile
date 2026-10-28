# ======================
# 1. 依赖安装阶段 (Dependencies)
# ======================
FROM node:22-slim AS dependencies

WORKDIR /app

ENV COREPACK_NPM_REGISTRY=https://registry.npmmirror.com

RUN npm install -g pnpm@12.4.1

# 先复制 workspace 配置和所有 package.json，利用 Docker 层缓存
COPY .npmrc ./
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./

# 只复制 workspace 包的 package.json，避免源码改动使 install 缓存失效
COPY packages/front-end/package.json ./packages/front-end/
COPY packages/monitor-sdk/package.json ./packages/monitor-sdk/
COPY packages/datatwin-core/package.json ./packages/datatwin-core/
COPY packages/datatwin-react/package.json ./packages/datatwin-react/
COPY packages/datatwin-chart-core/package.json ./packages/datatwin-chart-core/
COPY packages/datatwin-chart-react/package.json ./packages/datatwin-chart-react/
COPY packages/datatwin-chart-element/package.json ./packages/datatwin-chart-element/
COPY packages/datatwin-elements/package.json ./packages/datatwin-elements/

RUN pnpm install --frozen-lockfile --prod=false --ignore-scripts

# 再复制全部源码
COPY packages/ ./packages/


# ======================
# 2. 构建阶段 (Builder)
# ======================
FROM dependencies AS builder

WORKDIR /app

ARG VITE_API_BASE_URL
ARG VITE_APP_NAME
ARG VITE_APP_VERSION

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_APP_VERSION=$VITE_APP_VERSION

# 构建所有 workspace 包，排除 front-end 自身（避免重复构建）
RUN pnpm \
    --filter='./packages/datatwin-core' \
    --filter='./packages/datatwin-elements' \
    --filter='./packages/datatwin-react' \
    --filter='./packages/datatwin-chart-core' \
    --filter='./packages/datatwin-chart-element' \
    --filter='./packages/datatwin-chart-react' \
    --filter='./packages/monitor-sdk' \
    --filter='!./packages/back-end' \
    --parallel run build

# 再编译 front-end
WORKDIR /app/packages/front-end
RUN pnpm run build


# ======================
# 3. 生产阶段 - Nginx (Production)
# ======================
FROM nginx:alpine AS production

LABEL maintainer="ai-agent-team"
LABEL description="AI Agent Frontend Service"
LABEL version="2.0.0"

RUN rm /etc/nginx/conf.d/default.conf

COPY packages/front-end/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/packages/front-end/build/client /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
