/**
 * database.ts — Conexión y migraciones de SQLite usando sql.js
 * 
 * sql.js es SQLite compilado a WebAssembly. No necesita compilación
 * nativa ni Visual Studio Build Tools, funciona directamente.
 * 
 * La base de datos se guarda como archivo binario en:
 * %APPDATA%/crm-personal/database.sqlite
 * 
 * A diferencia de better-sqlite3, sql.js carga la DB en memoria
 * y necesita guardarse explícitamente a disco.
 */
import initSqlJs, { Database as SqlJsDatabase } from 'sql.js'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

// Variable global que mantiene la conexión a la base de datos
let db: SqlJsDatabase | null = null
// Ruta al archivo de la base de datos
let dbPath: string = ''
// Referencia a SQL.js inicializado
let SQL: any = null

/**
 * Inicializa sql.js y abre (o crea) la base de datos.
 * DEBE llamarse una vez al iniciar la app (es async porque sql.js carga WASM).
 */
export async function initDatabase(): Promise<SqlJsDatabase> {
  if (db) return db

  // Inicializar el motor sql.js (carga el WASM)
  SQL = await initSqlJs()

  // Carpeta de datos de la app
  const userDataPath = app.getPath('userData')
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true })
  }

  dbPath = path.join(userDataPath, 'database.sqlite')
  console.log('[DB] Base de datos en:', dbPath)

  // Si existe un archivo previo, cargarlo; si no, crear una DB nueva
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath)
    db = new SQL.Database(fileBuffer)
    console.log('[DB] Base de datos cargada desde disco ✓')
  } else {
    db = new SQL.Database()
    console.log('[DB] Base de datos nueva creada ✓')
  }

  // Ejecutar migraciones
  runMigrations(db)

  // Guardar a disco después de las migraciones
  saveDatabase()

  return db
}

/**
 * Obtiene la base de datos (debe haberse inicializado antes con initDatabase).
 * Lanza error si no se ha inicializado.
 */
export function getDatabase(): SqlJsDatabase {
  if (!db) {
    throw new Error('[DB] Base de datos no inicializada. Llama a initDatabase() primero.')
  }
  return db
}

/**
 * Guarda la base de datos en disco.
 * sql.js trabaja en memoria, así que hay que guardar explícitamente.
 */
export function saveDatabase(): void {
  if (!db || !dbPath) return
  try {
    const data = db.export()
    const buffer = Buffer.from(data)
    fs.writeFileSync(dbPath, buffer)
  } catch (error) {
    console.error('[DB] Error al guardar:', error)
  }
}

/**
 * Cierra la conexión y guarda los datos finales.
 */
export function closeDatabase(): void {
  if (db) {
    saveDatabase()
    db.close()
    db = null
    console.log('[DB] Conexión cerrada y datos guardados')
  }
}

/**
 * Helper: ejecuta una sentencia SQL y guarda a disco.
 * Útil para operaciones de escritura (INSERT, UPDATE, DELETE).
 */
export function runAndSave(sql: string, params?: any[]): void {
  const database = getDatabase()
  if (params) {
    database.run(sql, params)
  } else {
    database.run(sql)
  }
  saveDatabase()
}

/**
 * Helper: ejecuta un SELECT y devuelve los resultados como array de objetos.
 * Convierte el formato de sql.js (columnas + valores) a objetos JavaScript.
 */
export function queryAll(sql: string, params?: any[]): any[] {
  const database = getDatabase()
  const stmt = database.prepare(sql)
  if (params) stmt.bind(params)

  const results: any[] = []
  while (stmt.step()) {
    const row = stmt.getAsObject()
    results.push(row)
  }
  stmt.free()
  return results
}

/**
 * Helper: ejecuta un SELECT y devuelve el primer resultado (o null).
 */
export function queryOne(sql: string, params?: any[]): any | null {
  const results = queryAll(sql, params)
  return results.length > 0 ? results[0] : null
}

// ================================================================
// MIGRACIONES
// ================================================================

/**
 * Crea todas las tablas necesarias si no existen.
 * Seguro ejecutar múltiples veces gracias a IF NOT EXISTS.
 */
function runMigrations(db: SqlJsDatabase): void {
  console.log('[DB] Ejecutando migraciones...')

  // ─── Tabla: tasks (Tareas) ─────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id              TEXT PRIMARY KEY,
      title           TEXT NOT NULL,
      description     TEXT DEFAULT '',
      date            TEXT NOT NULL,
      time            TEXT DEFAULT '',
      category        TEXT DEFAULT '',
      priority        TEXT DEFAULT 'medium',
      completed       INTEGER DEFAULT 0,
      completed_at    TEXT,
      related_event_id TEXT,
      reminder_before INTEGER,
      created_at      TEXT NOT NULL,
      updated_at      TEXT NOT NULL
    )
  `)

  // ─── Tabla: events (Eventos de calendario) ─────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id              TEXT PRIMARY KEY,
      title           TEXT NOT NULL,
      description     TEXT DEFAULT '',
      start_datetime  TEXT NOT NULL,
      end_datetime    TEXT NOT NULL,
      location        TEXT DEFAULT '',
      source          TEXT DEFAULT 'local',
      source_id       TEXT DEFAULT '',
      calendar_id     TEXT DEFAULT '',
      color           TEXT DEFAULT '#4F46E5',
      created_at      TEXT NOT NULL,
      updated_at      TEXT NOT NULL
    )
  `)

  // ─── Tabla: emails (Correos cacheados) ─────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS emails (
      id              TEXT PRIMARY KEY,
      subject         TEXT DEFAULT '',
      sender_name     TEXT DEFAULT '',
      sender_email    TEXT DEFAULT '',
      snippet         TEXT DEFAULT '',
      body_preview    TEXT DEFAULT '',
      is_read         INTEGER DEFAULT 0,
      received_at     TEXT NOT NULL,
      source          TEXT DEFAULT 'gmail',
      source_id       TEXT DEFAULT '',
      cached_at       TEXT NOT NULL
    )
  `)

  // ─── Tabla: shortcuts (Accesos directos) ───────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS shortcuts (
      id              TEXT PRIMARY KEY,
      name            TEXT NOT NULL,
      url             TEXT NOT NULL,
      icon            TEXT DEFAULT '🔗',
      category        TEXT DEFAULT '',
      sort_order      INTEGER DEFAULT 0
    )
  `)

  // ─── Tabla: reminders (Recordatorios) ──────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS reminders (
      id              TEXT PRIMARY KEY,
      task_id         TEXT,
      event_id        TEXT,
      minutes_before  INTEGER NOT NULL,
      status          TEXT DEFAULT 'pending',
      fire_at         TEXT NOT NULL
    )
  `)

  // ─── Tabla: settings (Configuración) ───────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key             TEXT PRIMARY KEY,
      value           TEXT NOT NULL,
      updated_at      TEXT NOT NULL
    )
  `)

  // ─── Índices para búsquedas rápidas ────────────────────
  db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_events_start ON events(start_datetime)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_emails_received ON emails(received_at)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_reminders_fire ON reminders(fire_at)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status)`)

  // ─── Configuración por defecto ─────────────────────────
  const now = new Date().toISOString()
  const defaults = [
    ['reminder_default_minutes', '15'],
    ['sync_interval_minutes', '5'],
    ['emails_to_fetch', '50'],
    ['theme', 'light']
  ]
  for (const [key, value] of defaults) {
    db.run(`INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES (?, ?, ?)`,
      [key, value, now])
  }

  console.log('[DB] Migraciones completadas ✓')
}
