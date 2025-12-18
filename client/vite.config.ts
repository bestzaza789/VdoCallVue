import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  define: {
    // Fix for simple-peer and other Node.js packages
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['simple-peer'],
  },
})
