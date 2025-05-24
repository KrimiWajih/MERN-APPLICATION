import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/spotify': {
        target: 'https://mern-application-w42i.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'https://mern-application-w42i.onrender.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''), // Strips /api prefix
      },
      '/socket.io': {
        // Explicitly proxy Socket.IO WebSocket requests
        target: 'https://mern-application-w42i.onrender.com',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
    allowedHosts: [
      'localhost',
      'd37e-102-158-204-170.ngrok-free.app',
      'coruscating-genie-70b898.netlify.app',
      'mern-application-w42i.onrender.com',
      'mern-application-1-fozj.onrender.com'
    ],
  },
   build: {
    chunkSizeWarningLimit: 1000, // Increase limit to 1000 kB
  },
})
