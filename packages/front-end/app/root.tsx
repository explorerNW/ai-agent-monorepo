import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { useRoutePerformance } from "./hooks/useRoutePerformance";
import { useEffect } from "react";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "preload",
    as: "style",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
    media: "print",
    onLoad: (event: { target: HTMLLinkElement }) => {
      (event.target as HTMLLinkElement).media = "all";
    },
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        {/* Noscript fallback for fonts */}
        <noscript>
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
          />
        </noscript>
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  useRoutePerformance();

  // Register Service Worker - Only in production
  useEffect(() => {
    // Only register service worker in production builds
    const isProduction = import.meta.env.PROD === true;

    if (!isProduction) {
      console.log("[SW] Skipping registration in development mode");
      return;
    }

    if (!("serviceWorker" in navigator)) {
      console.warn("[SW] Service Workers not supported in this browser");
      return;
    }

    // Check protocol - Service Workers require secure context
    const isSecureContext =
      window.location.protocol === "https:" ||
      window.location.hostname === "localhost";
    if (!isSecureContext) {
      console.warn("[SW] Service Workers require HTTPS or localhost");
      return;
    }

    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log(
            "[SW] ✅ Registered successfully with scope:",
            registration.scope,
          );
          console.log("[SW] Active worker:", registration.active?.scriptURL);

          // Check for updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              console.log("[SW] 🔄 New version installing...");
              newWorker.addEventListener("statechange", () => {
                console.log("[SW] State changed:", newWorker.state);
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  console.log("[SW] ✨ New content available, please refresh.");
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error("[SW] ❌ Registration failed:", error.message);
          console.error("[SW] Common causes:");
          console.error(
            "[SW]   1. Self-signed certificate not trusted in browser",
          );
          console.error("[SW]   2. Not running on HTTPS or localhost");
          console.error("[SW]   3. Browser security settings blocking SW");
          console.error(
            "[SW] Solution: Visit https://localhost and accept the security warning first",
          );
        });
    });
  }, []);

  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    // Silently handle well-known URL requests from browser devtools
    if (error.status === 404 && error.data?.includes(".well-known")) {
      return null;
    }

    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
