# Front-end Environment Variables Guide

This guide explains how to use environment variables in the React Router + Vite front-end application.

## 📋 Overview

The front-end uses **Vite** for environment variable management. Unlike Create React App (which uses `process.env`), Vite uses `import.meta.env` and requires all client-side variables to be prefixed with `VITE_`.

## 🔧 Configuration Files

### `.env` - Current Environment Variables

```env
# Backend API Configuration
VITE_API_URL=http://localhost:3000
VITE_API_BASE_URL=http://localhost:3000/ai

# Application Configuration
VITE_APP_NAME=AI Assistant
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_STREAMING=true
VITE_ENABLE_FILE_UPLOAD=false

# Development Settings
VITE_DEBUG_MODE=false
```

### `.env.example` - Template

Copy this file to `.env` and customize values. This file is committed to Git as a reference.

## 📁 File Structure

```
packages/front-end/
├── .env                    # Your environment variables (not committed)
├── .env.example            # Template (committed)
├── .env.local              # Local overrides (optional, not committed)
├── .env.development        # Dev-specific vars (optional)
├── .env.production         # Prod-specific vars (optional)
└── app/
    ├── config/
    │   └── env.ts          # Type-safe env configuration module
    └── services/
        └── api.ts          # API service using env config
```

## 🚀 How to Use

### 1. Define Variables in `.env`

Create or edit `packages/front-end/.env`:

```env
VITE_API_URL=http://localhost:3000
VITE_API_BASE_URL=http://localhost:3000/ai
VITE_APP_NAME=My AI App
```

**Important:** All variables must start with `VITE_` prefix to be exposed to the client.

### 2. Access in Code

#### Option A: Direct Access (Not Recommended)

```typescript
const apiUrl = import.meta.env.VITE_API_URL;
```

#### Option B: Using Config Module (Recommended ✅)

```typescript
import { env, API_CONFIG } from '~/config/env';

// Use pre-configured constants
const response = await fetch(API_CONFIG.CHAT_ENDPOINT, {...});

// Or access individual values
console.log(env.appName);
console.log(env.apiBaseUrl);
```

### 3. Using the API Service

```typescript
import { sendChatMessage, processStream } from "~/services/api";

// Send message (automatically uses configured API URL)
const stream = await sendChatMessage(messages);

// Process streaming response
await processStream(
  stream,
  (chunk) => {
    console.log("Received chunk:", chunk);
  },
  () => {
    console.log("Stream complete");
  },
);
```

## 🌍 Environment-Specific Files

Vite supports multiple environment files:

| File                     | Purpose                      | Committed? |
| ------------------------ | ---------------------------- | ---------- |
| `.env`                   | Default for all environments | ❌ No      |
| `.env.local`             | Local overrides (all envs)   | ❌ No      |
| `.env.development`       | Development only             | ✅ Yes     |
| `.env.production`        | Production only              | ✅ Yes     |
| `.env.development.local` | Dev local overrides          | ❌ No      |
| `.env.production.local`  | Prod local overrides         | ❌ No      |

**Priority:** `.local` > environment-specific > default

Example:

```bash
# Development (.env.development)
VITE_API_URL=http://localhost:3000

# Production (.env.production)
VITE_API_URL=https://api.example.com
```

## 🐳 Docker Integration

### Development Mode

Environment variables are loaded from `.env` file and mounted volumes:

```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Production Mode

Variables can be set in three ways (priority order):

1. **Build Arguments** (highest priority):

```bash
docker-compose build --build-arg VITE_API_URL=https://api.example.com
```

2. **Docker Compose Args** (in `docker-compose.yml`):

```yaml
build:
  args:
    - VITE_API_URL=https://api.example.com
```

3. **`.env` File** (lowest priority):

```env
VITE_API_URL=https://api.example.com
```

**Note:** In production builds, environment variables are baked into the bundle at build time. They cannot be changed without rebuilding.

## 🔒 Security Best Practices

### ✅ DO:

- Store public configuration (API URLs, feature flags)
- Use `.gitignore` to exclude `.env` and `.env.local`
- Provide `.env.example` as template
- Validate required variables at startup

### ❌ DON'T:

- Store secrets (API keys, passwords, tokens)
- Commit `.env` files with real credentials
- Expose sensitive backend configuration
- Trust client-side validation alone

### Example - Safe vs Unsafe:

```env
# ✅ SAFE - Public configuration
VITE_API_URL=https://api.example.com
VITE_APP_NAME=My App
VITE_ENABLE_FEATURE_X=true

# ❌ UNSAFE - Secrets (use backend proxy instead)
VITE_SECRET_KEY=sk-1234567890
VITE_API_TOKEN=token-abc123
```

If you need to use API keys, create a backend endpoint that proxies requests and stores secrets server-side.

## 🛠️ Configuration Module

The `app/config/env.ts` module provides:

### Features:

- ✅ Type-safe access to environment variables
- ✅ Default values prevent undefined errors
- ✅ Centralized configuration management
- ✅ Pre-configured API endpoints
- ✅ Utility functions for common tasks

### Usage Examples:

```typescript
import { env, API_CONFIG, getApiUrl } from "~/config/env";

// 1. Access individual values
console.log(env.apiUrl); // "http://localhost:3000"
console.log(env.appName); // "AI Assistant"
console.log(env.enableStreaming); // true

// 2. Use pre-configured endpoints
fetch(API_CONFIG.CHAT_ENDPOINT); // "http://localhost:3000/ai/chat"
fetch(API_CONFIG.HEALTH_ENDPOINT); // "http://localhost:3000/health"

// 3. Build custom URLs
const customUrl = getApiUrl("/users/profile");
// Returns: "http://localhost:3000/ai/users/profile"
```

## 🐛 Debugging

### Check Current Configuration

Enable debug mode in `.env`:

```env
VITE_DEBUG_MODE=true
```

Configuration will be logged to console on app startup.

### Verify Variables Are Loaded

Add temporary logging:

```typescript
console.log("All env vars:", import.meta.env);
console.log("API URL:", import.meta.env.VITE_API_URL);
```

### Common Issues

**Issue:** Variable is `undefined`

- **Cause:** Missing `VITE_` prefix
- **Fix:** Rename to `VITE_YOUR_VAR`

**Issue:** Changes don't take effect

- **Cause:** Need to restart dev server
- **Fix:** Stop and restart: `pnpm run dev`

**Issue:** Works locally but not in Docker

- **Cause:** Variables not passed as build args
- **Fix:** Add to `docker-compose.yml` build args

## 📝 Migration from Hardcoded URLs

Before:

```typescript
// ❌ Hardcoded URL
const response = await fetch('http://niewang.uunat.com:41061/ai/chat', {
  method: 'POST',
  ...
});
```

After:

```typescript
// ✅ Using environment configuration
import { API_CONFIG } from '~/config/env';

const response = await fetch(API_CONFIG.CHAT_ENDPOINT, {
  method: 'POST',
  ...
});
```

Or even better, use the API service:

```typescript
// ✅ Using API service
import { sendChatMessage } from "~/services/api";

const stream = await sendChatMessage(messages);
```

## 🎯 Best Practices

1. **Always use the config module** - Don't access `import.meta.env` directly throughout your codebase
2. **Provide sensible defaults** - Ensure app works even if env vars are missing
3. **Document all variables** - Keep `.env.example` up to date
4. **Use TypeScript** - Get autocomplete and type checking
5. **Group related configs** - Use objects like `API_CONFIG` for related values
6. **Validate early** - Check required vars at app startup
7. **Keep it simple** - Don't over-engineer configuration

## 📚 Additional Resources

- [Vite Environment Variables Docs](https://vitejs.dev/guide/env-and-mode.html)
- [React Router Documentation](https://reactrouter.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🔄 Updating Environment Variables

When adding new variables:

1. Add to `.env.example` with description
2. Add to `app/config/env.ts` interface and implementation
3. Update this documentation
4. Communicate to team members
5. Update CI/CD pipelines if needed

Example:

```typescript
// In app/config/env.ts
interface EnvConfig {
  // ... existing fields
  newFeature: boolean;
}

export const env: EnvConfig = {
  // ... existing fields
  newFeature: import.meta.env.VITE_NEW_FEATURE === "true",
};
```
