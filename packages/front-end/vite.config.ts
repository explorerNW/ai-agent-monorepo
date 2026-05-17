import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { serviceWorkerPlugin } from "./plugins/service-worker-plugin";

export default defineConfig({
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    serviceWorkerPlugin({
      swSrc: "./app/sw.js", // Changed from sw.ts to sw.js - must use pure JavaScript
      swDest: "./build/client/sw.js",
      injectRegister: true,
    }),
  ],
  server: {
    host: "0.0.0.0",
    allowedHosts: ["niewang.uunat.com", "localhost"],
  },
});
