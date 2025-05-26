import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Ensure relative paths work for Electron
  build: {
    outDir: 'dist-renderer', // Output directory for renderer process
  },
});
