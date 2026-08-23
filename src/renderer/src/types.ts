/**
 * types.ts
 * 
 * Tipos e interfaces compartidos entre todos los componentes de la app.
 * Definen la estructura de datos para tareas, eventos, correos, etc.
 */

// ============================================================
// TAREAS
// ============================================================

/** Niveles de prioridad para las tareas */
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

/** Una tarea del CRM */
export interface Task {
  id: string
  title: string
  description: string
  date: string           // Formato: YYYY-MM-DD
  time: string           // Formato: HH:MM (puede estar vacío)
  category: string       // Etiqueta/categoría libre
  priority: TaskPriority
  completed: boolean
  completedAt: string | null   // ISO timestamp de cuando se completó
  relatedEventId: string | null // ID de evento relacionado (opcional)
  reminderBefore: number | null // Minutos antes para recordatorio
  createdAt: string      // ISO timestamp
  updatedAt: string      // ISO timestamp
}

/** Datos para crear una nueva tarea (sin los campos auto-generados) */
export interface CreateTaskInput {
  title: string
  description?: string
  date: string
  time?: string
  category?: string
  priority?: TaskPriority
  relatedEventId?: string | null
  reminderBefore?: number | null
}

/** Datos para actualizar una tarea existente (todos opcionales) */
export interface UpdateTaskInput {
  title?: string
  description?: string
  date?: string
  time?: string
  category?: string
  priority?: TaskPriority
  completed?: boolean
  relatedEventId?: string | null
  reminderBefore?: number | null
}

// ============================================================
// EVENTOS DE CALENDARIO
// ============================================================

/** Fuente del evento: Google Calendar, Outlook, o creado localmente */
export type EventSource = 'google' | 'outlook' | 'local'

/** Un evento del calendario */
export interface CalendarEvent {
  id: string
  title: string
  description: string
  startDatetime: string   // ISO timestamp
  endDatetime: string     // ISO timestamp
  location: string
  source: EventSource
  sourceId: string        // ID original de la API externa
  calendarId: string
  color: string           // Color hex para mostrar en el calendario
  createdAt: string
  updatedAt: string
}

// ============================================================
// CORREOS
// ============================================================

/** Fuente del correo: Gmail o Outlook */
export type EmailSource = 'gmail' | 'outlook'

/** Un correo electrónico (cacheado localmente) */
export interface Email {
  id: string
  subject: string
  senderName: string
  senderEmail: string
  snippet: string         // Previsualización corta del contenido
  bodyPreview: string     // Primeros ~500 caracteres del cuerpo
  isRead: boolean
  receivedAt: string      // ISO timestamp
  source: EmailSource
  sourceId: string        // ID original de la API
  cachedAt: string        // Cuándo se descargó al cache local
}

// ============================================================
// ACCESOS DIRECTOS (SHORTCUTS)
// ============================================================

/** Un acceso directo a herramienta, URL o aplicación */
export interface Shortcut {
  id: string
  name: string
  url: string             // URL web o ruta a programa local
  icon: string            // Emoji o nombre de icono de Lucide
  category: string
  sortOrder: number
}

/** Datos para crear un nuevo acceso directo */
export interface CreateShortcutInput {
  name: string
  url: string
  icon?: string
  category?: string
}

// ============================================================
// RECORDATORIOS
// ============================================================

/** Estado del recordatorio */
export type ReminderStatus = 'pending' | 'fired' | 'dismissed'

/** Un recordatorio programado */
export interface Reminder {
  id: string
  taskId: string | null
  eventId: string | null
  minutesBefore: number
  status: ReminderStatus
  fireAt: string          // ISO timestamp calculado
}

// ============================================================
// CONFIGURACIÓN
// ============================================================

/** Par clave-valor para configuración de la app */
export interface Setting {
  key: string
  value: string
  updatedAt: string
}

// ============================================================
// NAVEGACIÓN
// ============================================================

/** Páginas disponibles en la app */
export type PageName = 'dashboard' | 'tasks' | 'calendar' | 'inbox' | 'shortcuts' | 'settings'

// ============================================================
// API EXPUESTA POR EL PRELOAD (window.api)
// ============================================================

/**
 * Define todas las funciones que el renderer puede llamar
 * a través del puente IPC (preload → main)
 */
export interface ElectronAPI {
  // --- Tareas ---
  getTasks: (filters?: { date?: string; completed?: boolean; category?: string }) => Promise<Task[]>
  createTask: (task: CreateTaskInput) => Promise<Task>
  updateTask: (id: string, updates: UpdateTaskInput) => Promise<Task>
  deleteTask: (id: string) => Promise<void>
  toggleTaskComplete: (id: string) => Promise<Task>

  // --- Eventos ---
  getEvents: (startDate: string, endDate: string) => Promise<CalendarEvent[]>
  syncGoogleCalendar: () => Promise<CalendarEvent[]>

  // --- Correos ---
  getEmails: (limit?: number) => Promise<Email[]>
  syncGmail: () => Promise<Email[]>

  // --- Accesos directos ---
  getShortcuts: () => Promise<Shortcut[]>
  createShortcut: (shortcut: CreateShortcutInput) => Promise<Shortcut>
  updateShortcut: (id: string, updates: Partial<Shortcut>) => Promise<Shortcut>
  deleteShortcut: (id: string) => Promise<void>
  openShortcut: (url: string) => Promise<void>

  // --- Configuración ---
  getSetting: (key: string) => Promise<string | null>
  setSetting: (key: string, value: string) => Promise<void>

  // --- Google Auth ---
  googleLogin: () => Promise<boolean>
  googleLogout: () => Promise<void>
  isGoogleAuthenticated: () => Promise<boolean>

  // --- General ---
  openExternal: (url: string) => Promise<void>
  getStats: () => Promise<DashboardStats>
}

/** Estadísticas para las tarjetas KPI del Dashboard */
export interface DashboardStats {
  totalTasksToday: number
  completedTasksToday: number
  upcomingEvents: number
  unreadEmails: number
  pendingReminders: number
  completionRate: number    // Porcentaje 0-100
}

// ============================================================
// Extender la interfaz global de Window para TypeScript
// ============================================================
declare global {
  interface Window {
    api: ElectronAPI
  }
}
