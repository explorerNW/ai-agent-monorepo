# Welcome to React Router!

A modern, production-ready template for building full-stack React applications using React Router.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/remix-run/react-router-templates/tree/main/default)

## Features

- 🚀 Server-side rendering
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 🌍 Environment variable support
- 📱 **Service Worker & PWA Support** - Offline-first with intelligent caching
- 📖 [React Router docs](https://reactrouter.com/)

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Configuration

Set up environment variables:

```bash
# Copy the example file
cp .env.example .env

# Edit with your values
nano .env
```

See [Environment Variables Guide](./ENV_VARIABLES.md) for details.

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Building for Production

Create a production build:

```bash
npm run build
```

The build process includes:

- ✅ Optimized asset bundling
- ✅ Service Worker generation with precaching
- ✅ Automatic cache manifest injection
- ✅ Production-ready output

## Service Worker & PWA

This project includes a comprehensive Service Worker implementation with:

- **Intelligent Caching**: Different strategies for different resource types
- **Offline Support**: Graceful degradation when network is unavailable
- **Auto Updates**: Seamless Service Worker lifecycle management
- **Build Optimization**: Custom Vite plugin for optimal caching

### Quick Start

```bash
# Build with Service Worker
npm run build

# Start production server
npm start
```

Check browser DevTools → Application tab to verify Service Worker registration.

**Documentation:**

- 📘 [Full Guide](./SERVICE_WORKER.md)
- ⚡ [Quick Start](./SERVICE_WORKER_QUICK_START.md)

### Key Features

- ✨ Automatic precaching of critical assets
- 🔄 Network-first strategy for API calls
- 💾 Cache-first for static resources
- 📊 Real-time update notifications
- 🛠️ Developer tools for cache management


### 状态管理
| 状态类型 | 管理工具 | 典型场景 | 封装重点 |
| :--- | :--- | :--- | :--- |
| 服务端状态 | TanStack Query | API数据、缓存、分页、无限滚动 | 统一HttpClient、QueryKey工厂、全局错误处理 |
| 客户端全局状态 | Redux Toolkit | 用户信息、主题、权限、复杂表单向导 | Slice模块化、Selector记忆化、中间件 |
| UI/局部状态 | useState / Context | 弹窗开关、Tab切换、临时输入 | 避免过度全局化 |
| URL状态 | URL Params | 筛选条件、分页页码、搜索词 | 状态持久化、分享链接 |

#### 目录结构
```bash
src/
├── app/                  # 应用级配置
│   ├── store.ts          # Redux Store 配置
│   ├── queryClient.ts    # TanStack Query Client 配置
│   ├── providers.tsx     # 全局Provider聚合
│   └── router.tsx
├── shared/               # 共享基础设施（无业务逻辑）
│   ├── api/              # Axios实例、拦截器、类型定义
│   ├── hooks/            # useAuth, usePermission 等通用hooks
│   ├── components/       # UI组件库
│   └── utils/
├── features/             # 业务功能模块（核心）
│   ├── auth/
│   │   ├── api/          # login(), getUserInfo() + QueryKeys
│   │   ├── model/        # authSlice.ts (仅存token/user偏好)
│   │   ├── ui/           # LoginForm, UserAvatar
│   │   └── index.ts      # 公共API导出桶
│   ├── dashboard/
│   └── orders/
└── pages/                # 页面组装层

## Deployment

### Docker Deployment

To build and run using Docker:

```bash
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets + Service Worker
│   └── server/    # Server-side code
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

---

Built with ❤️ using React Router.
