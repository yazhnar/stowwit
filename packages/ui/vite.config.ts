import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// stowwit UI dev server — proxies API calls to the local core engine on :3000
// so the frontend can always call relative /api/* paths, in dev and in the
// static build served by the desktop/vscode shells alike.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist'
  }
});
