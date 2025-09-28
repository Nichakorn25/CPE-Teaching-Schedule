import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: "/plan/",
  build: {
    outDir: "C:/inetpub/plan",  // กำหนดให้ไฟล์ build ไปลงตรงนี้
    emptyOutDir: true,          // ล้างไฟล์เก่าก่อน build ใหม่
  },
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, '/api'),
      },
    },
  },
})
