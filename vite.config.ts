import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  optimizeDeps: {
    include: ['xlsx'],
    esbuildOptions: {
      target: 'esnext',
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://eims.site',
        changeOrigin: true,
        secure: false,
      },
      '/InvoiceTemplate': {
        target: 'https://eims.site',
        changeOrigin: true,
        secure: false,
      },
      '/TemplateFrame': {
        target: 'https://eims.site',
        changeOrigin: true,
        secure: false,
      },
      '/Auth': {
        target: 'https://eims.site',
        changeOrigin: true,
        secure: false,
      },
      '/User': {
        target: 'https://eims.site',
        changeOrigin: true,
        secure: false,
      },
      '/Prefix': {
        target: 'https://eims.site',
        changeOrigin: true,
        secure: false,
      },
      '/Serial': {
        target: 'https://eims.site',
        changeOrigin: true,
        secure: false,
      },
      '/SerialStatus': {
        target: 'https://eims.site',
        changeOrigin: true,
        secure: false,
      },
      '/InvoiceType': {
        target: 'https://eims.site',
        changeOrigin: true,
        secure: false,
      },
      '/Notification': {
        target: 'https://eims.site',
        changeOrigin: true,
        secure: false,
      },
      '/Audit': {
        target: 'https://eims.site',
        changeOrigin: true,
        secure: false,
      },
      // ⭐ NEW API ENDPOINTS
      '/Invoice': {
        target: 'https://eims.site',
        changeOrigin: true,
        secure: false,
      },
      '/Email': {
        target: 'https://eims.site',
        changeOrigin: true,
        secure: false,
      },
      '/File': {
        target: 'https://eims.site',
        changeOrigin: true,
        secure: false,
      },
      '/Tax': {
        target: 'https://eims.site',
        changeOrigin: true,
        secure: false,
      },
      '/Payment': {
        target: 'https://eims.site',
        changeOrigin: true,
        secure: false,
      },
      '/Company': {
        target: 'https://eims.site',
        changeOrigin: true,
        secure: false,
      },
      '/Customer': {
        target: 'https://eims.site',
        changeOrigin: true,
        secure: false,
      },
      '/Product': {
        target: 'https://eims.site',
        changeOrigin: true,
        secure: false,
      },
      '/InvoiceRequest': {
        target: 'https://eims.site',
        changeOrigin: true,
        secure: false,
      },
      '/Statement': {
        target: 'https://eims.site',
        changeOrigin: true,
        secure: false,
      },
      '/TaxApiStatus': {
        target: 'https://eims.site',
        changeOrigin: true,
        secure: false,
      },
      '/InvoiceErrorNotifications': {
        target: 'https://eims.site',
        changeOrigin: true,
        secure: false,
      },
      '/Dashboard': {
        target: 'https://eims.site',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
