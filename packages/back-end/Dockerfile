# ======================
# 1. 构建阶段 (Builder)
# ======================
FROM node:20-alpine AS builder

WORKDIR /app

# 1. 启用并激活 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 2. 【关键步骤】复制 Monorepo 的根配置文件
# 这是让 pnpm 识别 workspace 的关键
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./

# 3. 复制子应用的 package.json
COPY packages/back-end/package.json ./packages/back-end/package.json

# 4. 安装所有依赖 (包括 devDependencies)
# 这一步会为整个 workspace 安装依赖，确保 @nestjs/cli 被正确安装
RUN pnpm install --frozen-lockfile

# 5. 【关键步骤】在依赖安装后，再复制源代码
COPY packages/back-end/. ./packages/back-end/

# 6. 执行构建
# 使用 --filter 确保从 workspace 根目录正确构建指定的应用
RUN pnpm --filter=back-end run build


# ======================
# 2. 生产阶段 (Runner)
# ======================
FROM node:20-alpine AS runner

WORKDIR /app/packages/back-end

# 1. 启用 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 2. 复制 Monorepo 的根配置文件
# 即使是生产环境，也需要这些文件来正确解析依赖
COPY pnpm-workspace.yaml ../../
COPY package.json pnpm-lock.yaml ../../

# 3. 复制子应用的 package.json
COPY packages/back-end/package.json ./

# 4. 仅安装生产环境依赖
# --ignore-scripts 可以避免不必要的构建脚本执行，加快安装速度
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# 5. 从 builder 阶段复制构建产物
COPY --from=builder /app/packages/back-end/dist ./dist

# 6. 创建必要的目录
RUN mkdir -p uploads

EXPOSE 3000

# 7. 启动应用
# 建议直接使用 node 运行编译后的文件，更稳定
CMD ["node", "dist/main.js"]