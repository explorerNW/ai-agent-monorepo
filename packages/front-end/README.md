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
