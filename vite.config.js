import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import ElementPlus from 'unplugin-element-plus/vite'
import unocss from 'unocss/vite'
export default ({ mode }) => {
  // eslint-disable-next-line no-undef
  process.env = Object.assign(process.env, loadEnv(mode, process.cwd(), ''));
  return defineConfig({
    define: {
      __VUE_I18N_FULL_INSTALL__: true,
      __VUE_I18N_LEGACY_API__: false,
      __INTLIFY_PROD_DEVTOOLS__: false,
      APP_VERSION: "'0.3.14'",
    },
    base: process.env.VITE_BASE_URL,
    productionSourceMap: false,
    plugins: [
      vue(),
      unocss(),
      ElementPlus({ useSource: true }),
      Components({
        resolvers: [ElementPlusResolver()],
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
            @use "@/assets/scss/element.scss";
          `,
        },
      },
    },
    server: {
      proxy:
      {
        [process.env.VITE_API_VERSION || '/api3']: {
          target: process.env.VITE_SERVER_URL+process.env.VITE_API_VERSION || 'https://evse.msi.com/api3',
          pathRewrite: { 
            [`^${process.env.VITE_API_VERSION || '/api3'}`]: ''
          },
          changeOrigin: true,
          ws: true
        }
      
      // proxy: {
      //   '/api10': {
      //     target: process.env.VITE_SERVER_URL,
      //     changeOrigin: true,
      //     rewrite: (path) => path.replace(/^\/api10/, ''),
      //     secure: false,
      //   },
      },
      open: true,
      port: 8080,
      host: '0.0.0.0',
      hmr: true,
    },
    build: {
      outDir: 'dist/' + process.env.VITE_NAME,
    },
  })
}
