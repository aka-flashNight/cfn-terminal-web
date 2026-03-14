import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: './',
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:7077',
        changeOrigin: true,
        // 立绘从 SWF 导出可能需数分钟，代理超时与前端请求一致（10 分钟）
        timeout: 10 * 60 * 1000,
        proxyTimeout: 10 * 60 * 1000
      }
    }
  }
})
