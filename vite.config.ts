import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Dev proxy: requests to /rest/* are forwarded to the Solar System openData API
 * with the Authorization header injected server-side, so the API key never
 * reaches the browser bundle and the CORS preflight problem is avoided.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/rest': {
          target: 'https://api.le-systeme-solaire.net',
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              const key = env.SOLAR_API_KEY ?? '';
              if (key) {
                proxyReq.setHeader('Authorization', `Bearer ${key}`);
              }
            });
          },
        },
      },
    },
  };
});
