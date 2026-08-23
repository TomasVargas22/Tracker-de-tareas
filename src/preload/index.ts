/**
 * preload/index.ts — Script de precarga (Preload)
 * 
 * Este archivo actúa como "puente seguro" entre el proceso principal (Node.js)
 * y el proceso de renderizado (React/navegador).
 * 
 * ¿Por qué es necesario?
 * - El renderer no puede acceder directamente a Node.js por seguridad
 * - El preload expone solo las funciones específicas que necesitamos
 * - Usa contextBridge para inyectar `window.api` de forma segura
 * 
 * Flujo: React llama window.api.xxx() → ipcRenderer.invoke() → main process
 */
import { contextBridge, ipcRenderer } from 'electron'

/**
 * Expone la API al renderer como window.api
 * 
 * Cada método corresponde a un handler registrado en ipc-handlers.ts
 * El nombre del canal IPC (primer argumento de invoke) debe coincidir
 * exactamente con el registrado en ipcMain.handle()
 */
contextBridge.exposeInMainWorld('api', {

  // ─── TAREAS ────────────────────────────────────────────────
  getTasks: (filters?: { date?: string; completed?: boolean; category?: string }) =>
    ipcRenderer.invoke('tasks:getAll', filters),

  createTask: (task: any) =>
    ipcRenderer.invoke('tasks:create', task),

  updateTask: (id: string, updates: any) =>
    ipcRenderer.invoke('tasks:update', id, updates),

  deleteTask: (id: string) =>
    ipcRenderer.invoke('tasks:delete', id),

  toggleTaskComplete: (id: string) =>
    ipcRenderer.invoke('tasks:toggleComplete', id),

  // ─── EVENTOS DE CALENDARIO ──────────────────────────────────
  getEvents: (startDate: string, endDate: string) =>
    ipcRenderer.invoke('events:getByRange', startDate, endDate),

  syncGoogleCalendar: () =>
    ipcRenderer.invoke('events:syncGoogle'),

  // ─── CORREOS ────────────────────────────────────────────────
  getEmails: (limit?: number) =>
    ipcRenderer.invoke('emails:getAll', limit),

  syncGmail: () =>
    ipcRenderer.invoke('emails:syncGmail'),

  // ─── ACCESOS DIRECTOS ───────────────────────────────────────
  getShortcuts: () =>
    ipcRenderer.invoke('shortcuts:getAll'),

  createShortcut: (shortcut: any) =>
    ipcRenderer.invoke('shortcuts:create', shortcut),

  updateShortcut: (id: string, updates: any) =>
    ipcRenderer.invoke('shortcuts:update', id, updates),

  deleteShortcut: (id: string) =>
    ipcRenderer.invoke('shortcuts:delete', id),

  openShortcut: (url: string) =>
    ipcRenderer.invoke('shortcuts:open', url),

  // ─── CONFIGURACIÓN ─────────────────────────────────────────
  getSetting: (key: string) =>
    ipcRenderer.invoke('settings:get', key),

  setSetting: (key: string, value: string) =>
    ipcRenderer.invoke('settings:set', key, value),

  // ─── GOOGLE AUTH ────────────────────────────────────────────
  googleLogin: () =>
    ipcRenderer.invoke('google:login'),

  googleLogout: () =>
    ipcRenderer.invoke('google:logout'),

  isGoogleAuthenticated: () =>
    ipcRenderer.invoke('google:isAuthenticated'),

  // ─── UTILIDADES ─────────────────────────────────────────────
  openExternal: (url: string) =>
    ipcRenderer.invoke('app:openExternal', url),

  getStats: () =>
    ipcRenderer.invoke('app:getStats')
})
