import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === "production" ? "/" : "./", // Absolute paths for web, relative for Electron
  assetsInclude: ["**/*.lottie"], // Include .lottie files as assets
  build: {
    outDir: mode === "production" ? "dist" : "dist-renderer", // Different output for web vs Electron
    sourcemap: mode !== "production", // Source maps only in development
    minify: mode === "production" ? "esbuild" : false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          mui: ["@mui/material", "@mui/icons-material"],
          utils: ["axios", "zustand"],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true, // Allow external connections
    proxy:
      mode === "development"
        ? {
            "/api": {
              target: "http://localhost:8000",
              changeOrigin: true,
              secure: false,
            },
          }
        : undefined,
  },
  preview: {
    port: 5173,
    host: true,
  },
}));
