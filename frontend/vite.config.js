import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function apiPort(mode) {
  const env = loadEnv(mode, __dirname, '');
  return env.VITE_DEV_API_PORT || '3000';
}

function assertApiReachablePlugin(port) {
  const apiOrigin = `http://127.0.0.1:${port}`;
  return {
    name: 'assert-api-reachable',
    configureServer(server) {
      server.httpServer?.once('listening', () => {
        setTimeout(async () => {
          try {
            const res = await fetch(`${apiOrigin}/health`);
            const body = await res.json().catch(() => ({}));
            if (!res.ok || body.service !== 'personal-dashboard-api') {
              console.warn(`\n[vite] API health check failed at ${apiOrigin}\n`);
            }
          } catch (e) {
            console.warn(`\n[vite] Cannot reach API at ${apiOrigin}. Run: cd backend && npm run dev\n`);
          }
        }, 400);
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const port = apiPort(mode);
  const apiTarget = `http://127.0.0.1:${port}`;

  return {
    plugins: [react(), assertApiReachablePlugin(port)],
    server: {
      port: 5173,
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true },
      },
    },
  };
});
