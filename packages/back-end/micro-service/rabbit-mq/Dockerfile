FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
# Enable pnpm with Chinese mirror
RUN corepack enable && \
    corepack prepare pnpm@9.15.0 --activate && \
    npm config set registry https://registry.npmmirror.com && \
    pnpm install

COPY . .
RUN pnpm run build

FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN corepack enable && \
    corepack prepare pnpm@9.15.0 --activate && \
    npm config set registry https://registry.npmmirror.com

RUN pnpm install --prod --ignore-scripts

COPY --from=builder /app/dist ./dist
EXPOSE 3002
CMD ["pnpm", "run", "start:prod"]
