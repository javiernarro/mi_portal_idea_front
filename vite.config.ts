import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// Punto 17: al publicar (vite build), el sitio no escribe mensajes internos en la consola (F12)
const publicando = process.argv.includes('build')

export default defineConfig({
  build: {
    outDir: 'dist',
    // Punto 17: sin mapas del código fuente en el sitio publicado
    sourcemap: false,
  },
  esbuild: publicando ? { drop: ['console', 'debugger'] } : {},
  server: {
    host: '0.0.0.0',
    port: 5174,
  },
  plugins: [vue(), vueDevTools(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
