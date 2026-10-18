import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': process.env.PHARMACY_API_TARGET || 'http://localhost:8080',
    },
  },
})
