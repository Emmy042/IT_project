import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    proxy: {
      '/images': 'http://localhost:5000'
    }
  }
})
