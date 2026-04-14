import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  // Match ../server PORT so /api proxy hits the same process as `cd server && npm run dev`
  const serverEnv = loadEnv(mode, path.join(__dirname, '../server'), '');
  const port = serverEnv.PORT || '3000';
  const apiTarget = `http://127.0.0.1:${port}`;

  return {
    plugins: [vue()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
