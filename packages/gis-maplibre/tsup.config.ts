import { defineConfig } from "tsup";
import fs from "fs";
import path from "path";

import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ["maplibre-gl"],
  // ✅ 构建成功后执行回调
  onSuccess: async () => {
    const srcCss = path.resolve(
      __dirname,
      "node_modules/maplibre-gl/dist/maplibre-gl.css",
    );
    const destCss = path.resolve(__dirname, "dist/maplibre-gl.css");

    try {
      if (fs.existsSync(srcCss)) {
        fs.copyFileSync(srcCss, destCss);
        console.log("[tsup] Copied maplibre-gl.css to dist/");
      } else {
        console.warn(
          "[tsup] Warning: maplibre-gl.css not found in node_modules.",
        );
      }
    } catch (e) {
      console.error("[tsup] Failed to copy CSS:", e);
    }
  },
});
