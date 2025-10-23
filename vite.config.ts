import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: "/redfive-ui/",
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@arcgis/core']
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1500, // raise from 500kB
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@arcgis/core')) return 'esri'
          if (id.includes('node_modules')) return 'vendor'
        }
      }
    }
  },
  define: {
    global: 'globalThis'
  }
})



