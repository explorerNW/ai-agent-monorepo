import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import { nodeResolve } from "@rollup/plugin-node-resolve";

export default {
  input: "src/index.ts", // 你的 SDK 入口文件
  output: [
    {
      file: "dist/index.cjs",
      format: "cjs",
      sourcemap: true,
      exports: "named",
      generatedCode: "es2015",
    },
    { file: "dist/index.esm.js", format: "es", sourcemap: true },
    {
      file: "dist/index.umd.js",
      format: "umd",
      name: "EnterpriseMonitorSDK", // 浏览器通过 script 引入时的全局变量名
      sourcemap: true,
      plugins: [terser()], // UMD 格式通常进行压缩
    },
  ],
  plugins: [
    nodeResolve({ browser: true }),
    typescript({
      tsconfig: "./tsconfig.json",
      declaration: true,
      declarationDir: "dist",
      esModuleInterop: true,
      isolatedModules: true,
    }),
  ],
};
