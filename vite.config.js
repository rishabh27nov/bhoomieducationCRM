import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import localApiPlugin from './lib/devApi.js'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [localApiPlugin(), react()],
  server: {
    port: 3000,
    proxy: { '/api': 'http://127.0.0.1:5000' },
    open: true
  }
})
