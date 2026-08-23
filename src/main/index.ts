/**
 * main/index.ts — Punto de entrada del proceso principal de Electron
 * 
 * 1. Crea la ventana principal de la aplicación
 * 2. Inicializa la base de datos SQLite (async con sql.js)
 * 3. Registra los handlers IPC
 * 4. Inicia el verificador de recordatorios
 */
import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { initDatabase, closeDatabase } from './database'
import { registerIpcHandlers } from './ipc-handlers'
import { startReminderChecker, stopReminderChecker, cleanOldReminders } from './notifications'

// Referencia a la ventana principal
let mainWindow: BrowserWindow | null = null

/**
 * Crea la ventana principal de la aplicación.
 */
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    show: true,
    title: 'CRM Personal',
    autoHideMenuBar: true,
    backgroundColor: '#EEEDF5',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  })

  // Asegurar que la ventana sea visible y tenga foco
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error(`[Electron] Error al cargar renderer: ${errorCode} - ${errorDescription}`)
  })

  // Abrir links externos en el navegador del sistema
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // En desarrollo: cargar desde el servidor de Vite (HMR)
  // En producción: cargar el archivo HTML compilado
  const rendererUrl = process.env['ELECTRON_RENDERER_URL']
  if (rendererUrl) {
    mainWindow.loadURL(rendererUrl)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Abrir DevTools integrado si estamos en desarrollo
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools({ mode: 'right' })
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ================================================================
// CICLO DE VIDA DE LA APLICACIÓN
// ================================================================

app.whenReady().then(async () => {
  console.log('═══════════════════════════════════════════')
  console.log('  CRM Personal — Iniciando aplicación...')
  console.log('═══════════════════════════════════════════')

  // Paso 1: Inicializar base de datos (async porque sql.js carga WASM)
  await initDatabase()

  // Paso 2: Registrar handlers IPC
  registerIpcHandlers()

  // Paso 3: Crear ventana principal
  createWindow()

  // Paso 4: Iniciar verificador de recordatorios
  startReminderChecker()

  // Paso 5: Limpiar recordatorios antiguos
  cleanOldReminders()

  // macOS: re-crear ventana si se hace clic en el dock
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  stopReminderChecker()
  closeDatabase()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  stopReminderChecker()
  closeDatabase()
})
