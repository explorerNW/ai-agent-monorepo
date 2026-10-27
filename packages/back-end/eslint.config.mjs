import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import nestjsPlugin from '@darraghor/eslint-plugin-nestjs-typed';
import globals from 'globals';

// ✅ 使用 tseslint.config() 替代 defineConfig()
// 它会自动处理 @typescript-eslint 插件的幂等注册，避免 redefine 或 not found
export default defineConfig([
  // ==================== 全局忽略 ====================
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '*.spec.ts',
      '*.e2e-spec.ts',
      'eslint.config.mjs',
    ],
  },

  // ✅ 安全地引入 TS 类型检查预设（tseslint.config 会自动去重）
  ...tseslint.configs.recommendedTypeChecked,

  // ==================== NestJS 专用规则 ====================
  {
    name: 'back-end/nestjs-plugin',
    plugins: {
      '@darraghor/nestjs-typed': nestjsPlugin,
    },
    rules: {
      '@darraghor/nestjs-typed/injectable-should-be-provided': 'warn',
    },
  },

  // ==================== 语言选项 & 类型检查 ====================
  {
    name: 'back-end/language-options',
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // ==================== 规则覆盖（精细化控制）====================
  {
    name: 'back-end/custom-rules',
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-floating-promises': [
        'error',
        { ignoreVoid: true },
      ],
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-unsafe-enum-comparison': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
    },
  },

  // ==================== 测试文件宽松规则 ====================
  {
    name: 'back-end/test-files',
    files: ['**/*.spec.ts', '**/*.e2e-spec.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },
]);
