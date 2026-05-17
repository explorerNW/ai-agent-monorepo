import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("chat", "routes/Chat.tsx"),
  route("analytics", "routes/analytics.tsx"),
  route("service-worker", "routes/service-worker.tsx"),
] satisfies RouteConfig;
