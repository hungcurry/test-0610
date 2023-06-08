import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
export default ({ mode }) => {

  let env = loadEnv(mode, process.cwd(), '')
  return defineConfig({
    base:env.VITE_BASE_URL,
    productionSourceMap: false,
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      proxy: {
        '/api10': {
          target: 'https://dev-evse.msi.com',
          // target: 'https://m-cloud.msi.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api10/, ''),
          secure: false,
        }
      },
      open: true,
      port: 8080,
      host: '0.0.0.0'
    },
    build: {
      outDir: 'dist/' + env.VITE_NAME
    },
  })
};
