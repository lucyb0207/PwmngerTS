import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      "@pwmnger/crypto": path.resolve(__dirname, "../../packages/crypto/src"),
      "@pwmnger/vault": path.resolve(__dirname, "../../packages/vault/src"),
      "@pwmnger/storage": path.resolve(__dirname, "../../packages/storage/src"),
      "@pwmnger/app-logic": path.resolve(__dirname, "../../packages/appLogic/src"),
      "@pwmnger/ui": path.resolve(__dirname, "../../packages/ui/src"),
    },
    dedupe: ["react", "react-dom", "react-router-dom", "react-is"],
  },
  server: {
    port: 3333,
    host: "127.0.0.1",
    strictPort: false,
  },
  test: {
    server: {
      deps: {
        inline: [
          "@pwmnger/ui",
          "@pwmnger/crypto",
          "@pwmnger/vault",
          "@pwmnger/storage",
          "@pwmnger/app-logic",
          "react",
          "react-dom",
          "react-router-dom",
          "react-is",
          "react/jsx-runtime",
          "react/jsx-dev-runtime"
        ],
      },
    },
    globals: true,
    environment: "jsdom",
    setupFiles: [path.resolve(__dirname, "./src/test-setup.ts")],
    deps: {
      optimizer: {
        web: {
          enabled: true,
          include: ["react", "react-dom"]
        }
      }
    },
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
        },
      },
    },
  },
});
