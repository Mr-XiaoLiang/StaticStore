import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

/**
 * 站点部署在自定义域名 store.looly.top 的根路径，因此 base 固定为 '/'。
 * 若将来改挂到子路径，用环境变量 STORE_BASE 覆盖即可，不改代码。
 */
const defaultBase = '/'

export default defineConfig(({ command }) => {
  const base = command === 'build' ? process.env.STORE_BASE || defaultBase : '/'

  return {
    base,
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      host: '0.0.0.0',
      port: 5174,
      allowedHosts: true
    },
    build: {
      target: 'es2019',
      cssCodeSplit: true,
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vue: ['vue', 'vue-router']
          }
        }
      }
    }
  }
})
