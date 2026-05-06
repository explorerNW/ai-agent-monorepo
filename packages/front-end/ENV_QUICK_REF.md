# Environment Variables Quick Reference

## 🎯 TL;DR - How to Use

### 1. Set Variables in `.env`

```bash
# packages/front-end/.env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=My App
```

### 2. Access in Code

```typescript
import { env, API_CONFIG } from "~/config/env";

// Use it
fetch(API_CONFIG.CHAT_ENDPOINT);
console.log(env.appName);
```

**That's it!** The configuration module handles everything.

---

## 📋 Available Variables

| Variable                  | Default                    | Description                |
| ------------------------- | -------------------------- | -------------------------- |
| `VITE_API_URL`            | `http://localhost:3000`    | Backend server URL         |
| `VITE_API_BASE_URL`       | `http://localhost:3000/ai` | API base path              |
| `VITE_APP_NAME`           | `AI Assistant`             | Application name           |
| `VITE_APP_VERSION`        | `1.0.0`                    | App version                |
| `VITE_ENABLE_STREAMING`   | `true`                     | Enable streaming responses |
| `VITE_ENABLE_FILE_UPLOAD` | `false`                    | Enable file uploads        |
| `VITE_DEBUG_MODE`         | `false`                    | Enable debug logging       |

---

## 🔑 Key Points

✅ **Must have `VITE_` prefix** - Otherwise won't be accessible  
✅ **Edit `.env` file** - Not committed to Git  
✅ **Restart dev server** - After changing variables  
✅ **Use config module** - Don't access `import.meta.env` directly

❌ **No secrets** - Never store API keys or passwords  
❌ **No `process.env`** - Vite uses `import.meta.env`

---

## 🚀 Common Tasks

### Change API URL

```env
# .env
VITE_API_URL=https://api.production.com
VITE_API_BASE_URL=https://api.production.com/v1
```

### Enable Debug Mode

```env
VITE_DEBUG_MODE=true
```

### Add New Variable

1. Add to `.env`
2. Add to `.env.example`
3. Add to `app/config/env.ts`
4. Restart dev server

---

## 🐳 Docker Commands

### Development

```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Production (with custom vars)

```bash
docker-compose build \
  --build-arg VITE_API_URL=https://api.example.com \
  --build-arg VITE_APP_NAME="Production App"
docker-compose up -d
```

---

## 🆘 Troubleshooting

| Problem                      | Solution                   |
| ---------------------------- | -------------------------- |
| Variable is `undefined`      | Check `VITE_` prefix       |
| Changes not applied          | Restart dev server         |
| Works locally, not in Docker | Add to build args          |
| TypeScript errors            | Import from `~/config/env` |

---

## 📚 Full Documentation

See [ENV_VARIABLES.md](./ENV_VARIABLES.md) for complete guide.
