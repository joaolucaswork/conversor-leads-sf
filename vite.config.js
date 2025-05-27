import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./", // Ensure relative paths work for Electron
  assetsInclude: ["**/*.lottie"], // Include .lottie files as assets
  build: {
    outDir: "dist-renderer", // Output directory for renderer process
  },
});
