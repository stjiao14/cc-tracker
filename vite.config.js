import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/cc-tracker/',
  server: {
    proxy: {
      '/partnerapi': {
        target: 'https://seats.aero',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
