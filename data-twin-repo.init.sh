#!/bin/bash
# ==========================================
# DataTwin OS 集成到现有 Monorepo 的操作脚本
# ==========================================

echo "🚀 开始集成 DataTwin OS 到你的 Monorepo..."

# 1. 创建包目录结构 (假设你的 packages 目录叫 packages)
mkdir -p packages/datatwin-core/src
mkdir -p packages/datatwin-elements/src
mkdir -p packages/datatwin-react/src

# 2. 初始化 Core 包 (Layer 1: 纯逻辑)
cat << 'EOF' > packages/datatwin-core/package.json
{
  "name": "@datatwin/core",
  "version": "0.0.1",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "dev": "tsup src/index.ts --watch --format cjs,esm --dts"
  },
  "dependencies": {
    "three": "^0.160.0"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.0.0"
  },
  "peerDependencies": {
    "echarts": "^5.0.0"
  }
}
EOF

# 3. 初始化 React 适配器包 (Layer 3: 框架适配)
cat << 'EOF' > packages/datatwin-react/package.json
{
  "name": "@datatwin/react",
  "version": "0.0.1",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup src/index.tsx --format cjs,esm --dts",
    "dev": "tsup src/index.tsx --watch --format cjs,esm --dts"
  },
  "dependencies": {
    "@datatwin/core": "workspace:*", 
    "@datatwin/elements": "workspace:*"
  },
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.0.0"
  }
}
EOF

# 4. 初始化 Web Components 包 (Layer 2: UI 容器)
cat << 'EOF' > packages/datatwin-elements/package.json
{
  "name": "@datatwin/elements",
  "version": "0.0.1",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "dev": "tsup src/index.ts --watch --format cjs,esm --dts"
  },
  "dependencies": {
    "@datatwin/core": "workspace:*"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.0.0"
  }
}
EOF

echo "✅ 包结构初始化完成！"
echo "⚠️ 请手动执行以下步骤："
echo "1. 在根目录 pnpm-workspace.yaml 中确认包含了 'packages/*'"
echo "2. 运行 'pnpm install' 以链接工作区依赖"
echo "3. 在你的业务应用 (apps/xxx) 的 package.json 中添加依赖: '@datatwin/react': 'workspace:*'"
echo "4. 运行 'pnpm dev' 启动开发环境"