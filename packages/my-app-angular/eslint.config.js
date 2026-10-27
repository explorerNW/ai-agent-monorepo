import { defineConfig } from 'eslint/config';
import angular from 'angular-eslint';
import tseslint from 'typescript-eslint';
import { baseConfig } from '../shared/eslint-config/base.js';

const COMPONENT_PREFIX = 'app';

export default defineConfig([
  // 0. 全局忽略
  {
    ignores: ['**/dist/**', '**/build/**', '**/.angular/**', '**/node_modules/**'],
  },

  // 1. 继承共享基线（确保 baseConfig 内部也已正确限定 files）
  ...baseConfig,

  // ==========================================
  // 2. ✅ Angular TypeScript 配置（必须包裹在 files 限制中）
  // ==========================================
  {
    files: ['**/*.ts'],
    extends: [
      ...angular.configs.tsRecommended,
      tseslint.configs.recommendedTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'default', format: ['camelCase'], leadingUnderscore: 'allow' },
        { selector: 'variable', format: ['camelCase', 'UPPER_CASE'], leadingUnderscore: 'allow' },
        { selector: 'typeLike', format: ['PascalCase'] },
        { selector: 'enumMember', format: ['UPPER_CASE', 'PascalCase'] },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: COMPONENT_PREFIX, style: 'kebab-case' },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: COMPONENT_PREFIX, style: 'camelCase' },
      ],
      '@angular-eslint/prefer-standalone': 'error',
      '@angular-eslint/use-lifecycle-interface': 'error',
      '@angular-eslint/no-output-on-prefix': 'error',
      'no-restricted-syntax': [
        'error',
        { selector: "Decorator[expression.callee.name='Input']", message: 'Angular 18+ 请使用 input() / input.required() 替代 @Input() 装饰器。' },
        { selector: "Decorator[expression.callee.name='Output']", message: 'Angular 18+ 请使用 output() 替代 @Output() 装饰器。' },
        { selector: "CallExpression[callee.property.name='markForCheck']", message: 'Zoneless 项目禁止使用 markForCheck()，请使用 Signals 自动追踪。' },
        { selector: "CallExpression[callee.property.name='detectChanges']", message: 'Zoneless 项目禁止使用 detectChanges()。' },
        { selector: "CallExpression[callee.object.property.name='ngZone'][callee.property.name='run']", message: 'Zoneless 项目禁止使用 NgZone.run()。' },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: '@angular/core', importNames: ['ChangeDetectorRef'], message: 'Zoneless 项目禁止注入 CDR，请使用 Signals 进行状态管理。' },
            { name: '@angular/core', importNames: ['NgZone'], message: 'Zoneless 项目禁止注入 NgZone。' },
          ],
        },
      ],
    },
  },

  // ==========================================
  // 3. ✅ Angular 模板配置（同样包裹在 files 限制中）
  // ==========================================
  {
    files: ['**/*.html'],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {
      '@angular-eslint/template/prefer-control-flow': 'error',
      '@angular-eslint/template/banana-in-box': 'error',
      '@angular-eslint/template/no-negated-async': 'error',
      '@angular-eslint/template/no-call-expression': 'error',
      '@angular-eslint/template/click-events-have-key-events': 'warn',
      '@angular-eslint/template/mouse-events-have-key-events': 'warn',
    },
  },
]);