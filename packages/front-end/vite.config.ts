import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { visualizer } from "rollup-plugin-visualizer";
import compression from "vite-plugin-compression";
import { serviceWorkerPlugin } from "./plugins/service-worker-plugin";

export default defineConfig(({ mode }) => ({
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    serviceWorkerPlugin({
      swSrc: "./app/sw.js", // Changed from sw.ts to sw.js - must use pure JavaScript
      swDest: "./build/client/sw.js",
      injectRegister: true,
    }),
    // 仅在 analyze 模式下加载分析插件
    mode === "analyze" &&
      visualizer({
        open: true, // 构建完成后自动打开浏览器展示报告
        filename: "dist/stats.html", // 指定生成的报告文件名
        gzipSize: true, // 显示 gzip 压缩后的体积
        brotliSize: true, // 显示 brotli 压缩后的体积
      }),
    compression({
      algorithm: "gzip",
      ext: ".gz",
      threshold: 10240, // 大于 10KB 才压缩
    }),
    // Brotli 压缩（现代浏览器支持更好，压缩率更高）
    compression({
      algorithm: "brotliCompress",
      ext: ".br",
      threshold: 10240,
    }),
  ].filter(Boolean),
  build: {
    rolldownOptions: {
      output: {
        cssCodeSplit: true,
        codeSplitting: {
          minSize: 50 * 1024, // 大于 50KB 的包进行拆分
          maxSize: 250 * 1024, // 最大不超过 200KB
        },
      },
    },
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["niewang.uunat.com", "localhost"],
  },
}));
