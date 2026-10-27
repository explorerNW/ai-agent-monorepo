import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export const baseConfig = [
  prettier,
  // 必须将 Type-Aware 预设和规则严格限制在 .ts/.tsx 文件中
  {
    files: ["**/*.{ts,tsx}"],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname, // 注意：这里可能需要改为动态传入或在子包覆盖
      },
    },
    rules: {
      // 全仓统一的底线规则
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
  // 非 Type-Aware 的通用规则可以放在外面
  {
    rules: {
      "no-console": "warn",
    },
  },
];
