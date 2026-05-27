FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json ./
# Enable pnpm with Chinese mirror
RUN corepack enable && \
    corepack prepare pnpm@9.15.0 --activate && \
    npm config set registry http://192.168.1.118:4873 && \
    pnpm install

COPY . .
RUN pnpm run build

FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN corepack enable && \
    corepack prepare pnpm@9.15.0 --activate && \
    npm config set registry http://192.168.1.118:4873

RUN pnpm install --prod --ignore-scripts

COPY --from=builder /app/dist ./dist
EXPOSE 3002
CMD ["pnpm", "run", "start:prod"]
