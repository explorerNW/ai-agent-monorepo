import { defineConfig } from 'eslint/config';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import reactCompiler from 'eslint-plugin-react-compiler';
import { baseConfig } from '../shared/eslint-config/base.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig([
  // 0. 全局忽略
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.react-router/**/*.{ts,tsx}',
      '*.config.{js,ts,mjs,mts}',
    ],
  },

  // 1. ✅ 展开共享基线（tseslint.config 会自动处理内部数组）
  ...baseConfig,

  // 2. React 专属配置
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'react-compiler': reactCompiler,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      // React Hooks (从 flat.recommended 中提取核心规则)
      ...reactHooks.configs.flat.recommended.rules,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // React Refresh
      ...reactRefresh.configs.vite.rules,

      // React Compiler
      ...reactCompiler.configs.recommended.rules,
      'react-compiler/react-compiler': 'error',
      '@typescript-eslint/no-base-to-string': 'warn',
      '@typescript-eslint/no-floating-promises': [
        'warn',
        {
          // ✅ 不再要求 void，而是直接放行已知的安全函数调用
          allowForKnownSafeCalls: [
            { from: 'package', name: 'useNavigate', package: 'react-router-dom' },
            // 如果function你自己定义的，可以按文件路径或模块名添加
          ],
          ignoreIIFE: true, // 允许立即执行的异步函数表达式
        },
      ],
    },
  },

  // 3. JS 配置文件专用（无类型检查）
  {
    files: ['*.config.{js,ts,mjs,mts}'],
    languageOptions: {
      globals: globals.node,
    },
  },
]);
