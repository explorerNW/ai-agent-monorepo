import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: {
    // ✅ 关键修复：使用 resolve 选项帮助 tsup 找到类型定义
    resolve: true,
    // 如果仍然报错，可以尝试禁用 compilerOptions 中的 strict 检查
    compilerOptions: {
      skipLibCheck: true,
      moduleResolution: "bundler", // 或 'node'
    },
  },
  splitting: false,
  sourcemap: true,
  clean: true,

  // ✅ 关键：将 echarts 设为外部依赖
  // 这样 tsup 不会尝试打包它们的代码，也不会深度检查它们的内部类型结构
  external: ["echarts"],

  // 确保 esbuild 不处理这些外部依赖
  noExternal: [],

  esbuildOptions(options) {
    options.platform = "browser";
    options.bundle = false; // 因为使用了 external，不需要 bundle 这些库
  },
});
