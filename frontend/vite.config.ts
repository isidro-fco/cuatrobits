/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // API_URL permite apuntar a un backend en otro puerto
      '/api': process.env.API_URL ?? 'http://localhost:3000',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/configuracionPruebas.ts'],
    // Las partidas completas con userEvent pueden tardar más cuando el backend se prueba en paralelo
    testTimeout: 15_000,
  },
})
