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
        target: 'http://159.223.64.31',
        changeOrigin: true,
        secure: false,
      },
      '/InvoiceTemplate': {
        target: 'http://159.223.64.31',
        changeOrigin: true,
        secure: false,
      },
      '/TemplateFrame': {
        target: 'http://159.223.64.31',
        changeOrigin: true,
        secure: false,
      },
      '/Auth': {
        target: 'http://159.223.64.31',
        changeOrigin: true,
        secure: false,
      },
      '/User': {
        target: 'http://159.223.64.31',
        changeOrigin: true,
        secure: false,
      },
      '/Prefix': {
        target: 'http://159.223.64.31',
        changeOrigin: true,
        secure: false,
      },
      '/Serial': {
        target: 'http://159.223.64.31',
        changeOrigin: true,
        secure: false,
      },
      '/SerialStatus': {
        target: 'http://159.223.64.31',
        changeOrigin: true,
        secure: false,
      },
      '/InvoiceType': {
        target: 'http://159.223.64.31',
        changeOrigin: true,
        secure: false,
      },
      '/Notification': {
        target: 'http://159.223.64.31',
        changeOrigin: true,
        secure: false,
      },
      '/Audit': {
        target: 'http://159.223.64.31',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
