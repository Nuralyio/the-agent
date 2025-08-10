import { vitePlugin as remix } from "@remix-run/dev";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    remix({
      ignoredRouteFiles: ["**/.*"],
    }),
  ],
  server: {
    port: 3003,
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "app"),
    },
  },
  ssr: {
    noExternal: ["@fluentui/react-icons"],
  },
});
