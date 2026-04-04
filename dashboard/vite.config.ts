import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:3000',
      '/guilds': 'http://localhost:3000',
      '/guild': 'http://localhost:3000',
      '/bot': 'http://localhost:3000',
      '/health': 'http://localhost:3000',
      '/ws': {
        target: 'http://localhost:3000',
        ws: true,
      },
    },
  },
})
