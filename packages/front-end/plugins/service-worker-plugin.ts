import type { Plugin } from "vite";
import * as fs from "fs";
import * as path from "path";
import { createHash as createCryptoHash } from "crypto";

interface ServiceWorkerPluginOptions {
  swSrc: string;
  swDest: string;
  injectRegister?: boolean;
  precachePatterns?: string[];
}

export function serviceWorkerPlugin(
  options: ServiceWorkerPluginOptions,
): Plugin {
  const {
    swSrc,
    swDest,
    injectRegister = true,
    precachePatterns = [
      "**/*.{js,css,html,json,png,jpg,jpeg,gif,svg,woff,woff2}",
    ],
  } = options;

  let buildOutputDir = "";
  let assetList: Array<{ url: string; revision: string }> = [];

  return {
    name: "vite-plugin-service-worker",

    configResolved(config) {
      // Get the build output directory
      buildOutputDir = path.resolve(config.root, config.build.outDir || "dist");
    },

    generateBundle(_, bundle) {
      // Collect all assets for precaching
      assetList = [];

      for (const [fileName, asset] of Object.entries(bundle)) {
        if (asset.type === "asset" || asset.type === "chunk") {
          // Skip service worker itself
          if (fileName.includes("sw.") || fileName.includes("service-worker")) {
            continue;
          }

          // Calculate hash for cache busting
          const content =
            asset.type === "asset" ? (asset.source as string) : asset.code;

          const hash = createHash(content.toString());

          assetList.push({
            url: `/${fileName}`,
            revision: hash,
          });
        }
      }

      console.log(
        `[Service Worker] Collected ${assetList.length} assets for precaching`,
      );
    },

    closeBundle() {
      // Read the source service worker file
      const swSourcePath = path.resolve(process.cwd(), swSrc);

      if (!fs.existsSync(swSourcePath)) {
        console.warn(`[Service Worker] Source file not found: ${swSourcePath}`);
        return;
      }

      let swContent = fs.readFileSync(swSourcePath, "utf-8");

      // Inject precache manifest
      const manifestJSON = JSON.stringify(assetList, null, 2);
      swContent = swContent.replace(
        /\/\* __PRECACHE_MANIFEST__ \*\//,
        manifestJSON,
      );

      // Create destination directory if it doesn't exist
      const destDir = path.dirname(path.resolve(process.cwd(), swDest));
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      // Write the optimized service worker
      const swDestPath = path.resolve(process.cwd(), swDest);
      fs.writeFileSync(swDestPath, swContent, "utf-8");

      console.log(`[Service Worker] Generated at ${swDestPath}`);

      // Optionally inject registration script
      if (injectRegister) {
        injectRegistrationScript(buildOutputDir);
      }
    },
  };
}

function createHash(content: string): string {
  return createCryptoHash("sha256")
    .update(content)
    .digest("hex")
    .substring(0, 8);
}

function injectRegistrationScript(outputDir: string) {
  const registerScript = `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('[SW] Registered with scope:', registration.scope);
      })
      .catch(error => {
        console.error('[SW] Registration failed:', error);
      });
  });
}
`;

  // Inject into index.html if it exists
  const indexPath = path.join(outputDir, "index.html");
  if (fs.existsSync(indexPath)) {
    let html = fs.readFileSync(indexPath, "utf-8");

    // Check if already injected
    if (!html.includes("navigator.serviceWorker.register")) {
      html = html.replace(
        "</body>",
        `<script>${registerScript}</script>\n</body>`,
      );
      fs.writeFileSync(indexPath, html, "utf-8");
      console.log(
        "[Service Worker] Injected registration script into index.html",
      );
    }
  }
}
