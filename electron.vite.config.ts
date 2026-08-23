/**
 * electron.vite.config.ts
 * 
 * Configuración de electron-vite para compilar los 3 procesos de Electron:
 * - main:     Proceso principal (Node.js) — maneja ventana, DB, APIs
 * - preload:  Script de precarga — puente seguro entre main y renderer
 * - renderer: Proceso de renderizado (React) — la interfaz de usuario
 */
import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Proceso principal: externaliza TODAS las dependencias (se cargan en runtime)
  main: {
    plugins: [externalizeDepsPlugin()]
  },

  // Script de precarga: también externaliza dependencias
  preload: {
    plugins: [externalizeDepsPlugin()]
  },

  // Proceso de renderizado: React con HMR
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src/renderer/src')
      }
    },
    plugins: [react()]
  }
})
