# ======================
# 1. 依赖安装阶段 (Dependencies)
# ======================
FROM node:22-alpine AS dependencies

WORKDIR /app

ARG NPM_REGISTRY=https://registry.npmmirror.com
ENV COREPACK_NPM_REGISTRY=${NPM_REGISTRY}

# 🔑 用 corepack 固定 pnpm 版本（和 back-end 一致），避免 @latest 每次重新下载
RUN corepack enable && corepack prepare pnpm@12.4.1 --activate && \
    pnpm config set store-dir /root/.local/share/pnpm/store

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

# 🔑 加 --prefer-offline 优先使用本地缓存
RUN --mount=type=cache,id=pnpm-store-front-end,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prod=false --ignore-scripts --prefer-offline


# ======================
# 2. Datatwin 基座编译（独立缓存层）
# ======================
# 🔑 关键优化：单独一个 stage，只有 datatwin 源码变更才会使此层失效
# front-end 源码变更不会触发 datatwin 重编
FROM dependencies AS datatwin-build

# 只复制 datatwin 和 monitor-sdk 源码，不复制 front-end
COPY packages/datatwin-core/ ./packages/datatwin-core/
COPY packages/datatwin-elements/ ./packages/datatwin-elements/
COPY packages/datatwin-react/ ./packages/datatwin-react/
COPY packages/datatwin-chart-core/ ./packages/datatwin-chart-core/
COPY packages/datatwin-chart-element/ ./packages/datatwin-chart-element/
COPY packages/datatwin-chart-react/ ./packages/datatwin-chart-react/
COPY packages/monitor-sdk/ ./packages/monitor-sdk/

# 编译所有 datatwin 包
RUN pnpm \
    --filter='./packages/datatwin-core' \
    --filter='./packages/datatwin-elements' \
    --filter='./packages/datatwin-react' \
    --filter='./packages/datatwin-chart-core' \
    --filter='./packages/datatwin-chart-element' \
    --filter='./packages/datatwin-chart-react' \
    --filter='./packages/monitor-sdk' \
    --parallel run build


# ======================
# 3. Front-end 构建（只依赖 datatwin 编译产物）
# ======================
FROM datatwin-build AS builder

WORKDIR /app

ARG VITE_API_BASE_URL
ARG VITE_APP_NAME
ARG VITE_APP_VERSION

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_APP_VERSION=$VITE_APP_VERSION

# 🔑 最后才复制 front-end 源码，这一层变更不影响上面的 datatwin 编译缓存
COPY packages/front-end/ ./packages/front-end/

# 编译 front-end
WORKDIR /app/packages/front-end
RUN pnpm run build


# ======================
# 4. 生产阶段 - Nginx (Production)
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
