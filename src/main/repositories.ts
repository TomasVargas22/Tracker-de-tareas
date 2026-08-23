/**
 * repositories.ts — Operaciones CRUD para todas las entidades
 * 
 * Usa los helpers de database.ts (queryAll, queryOne, runAndSave)
 * en vez de la API directa de better-sqlite3.
 * 
 * Cada sección maneja las operaciones para una entidad:
 * - TaskRepository: Tareas
 * - EventRepository: Eventos de calendario
 * - EmailRepository: Cache de correos
 * - ShortcutRepository: Accesos directos
 * - SettingsRepository: Configuración
 */
import { v4 as uuidv4 } from 'uuid'
import { queryAll, queryOne, runAndSave } from './database'

// ================================================================
// TASK REPOSITORY — Operaciones de Tareas
// ================================================================

export const TaskRepository = {

  /**
   * Obtiene tareas con filtros opcionales.
   */
  getAll(filters?: { date?: string; completed?: boolean; category?: string }) {
    let query = 'SELECT * FROM tasks WHERE 1=1'
    const params: any[] = []

    if (filters?.date) {
      query += ' AND date = ?'
      params.push(filters.date)
    }
    if (filters?.completed !== undefined) {
      query += ' AND completed = ?'
      params.push(filters.completed ? 1 : 0)
    }
    if (filters?.category) {
      query += ' AND category = ?'
      params.push(filters.category)
    }

    query += ' ORDER BY date ASC, time ASC'
    const rows = queryAll(query, params.length > 0 ? params : undefined)

    return rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description || '',
      date: row.date,
      time: row.time || '',
      category: row.category || '',
      priority: row.priority || 'medium',
      completed: row.completed === 1,
      completedAt: row.completed_at || null,
      relatedEventId: row.related_event_id || null,
      reminderBefore: row.reminder_before || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))
  },

  /**
   * Obtiene una tarea por su ID.
   */
  getById(id: string) {
    const row = queryOne('SELECT * FROM tasks WHERE id = ?', [id])
    if (!row) return null
    return {
      id: row.id,
      title: row.title,
      description: row.description || '',
      date: row.date,
      time: row.time || '',
      category: row.category || '',
      priority: row.priority || 'medium',
      completed: row.completed === 1,
      completedAt: row.completed_at || null,
      relatedEventId: row.related_event_id || null,
      reminderBefore: row.reminder_before || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  },

  /**
   * Crea una nueva tarea y la devuelve.
   */
  create(input: {
    title: string
    description?: string
    date: string
    time?: string
    category?: string
    priority?: string
    relatedEventId?: string | null
    reminderBefore?: number | null
  }) {
    const id = uuidv4()
    const now = new Date().toISOString()

    runAndSave(
      `INSERT INTO tasks (id, title, description, date, time, category, priority,
                          completed, related_event_id, reminder_before, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
      [
        id,
        input.title,
        input.description || '',
        input.date,
        input.time || '',
        input.category || '',
        input.priority || 'medium',
        input.relatedEventId || null,
        input.reminderBefore || null,
        now,
        now
      ]
    )

    return this.getById(id)!
  },

  /**
   * Actualiza una tarea existente con los campos proporcionados.
   */
  update(id: string, updates: Record<string, any>) {
    const now = new Date().toISOString()

    // Mapear nombres de interfaz → nombres de columna en la DB
    const fieldMap: Record<string, string> = {
      title: 'title',
      description: 'description',
      date: 'date',
      time: 'time',
      category: 'category',
      priority: 'priority',
      completed: 'completed',
      relatedEventId: 'related_event_id',
      reminderBefore: 'reminder_before'
    }

    const setClauses: string[] = ['updated_at = ?']
    const params: any[] = [now]

    for (const [key, value] of Object.entries(updates)) {
      const column = fieldMap[key]
      if (!column) continue

      if (key === 'completed') {
        setClauses.push(`${column} = ?`)
        params.push(value ? 1 : 0)
        if (value) {
          setClauses.push('completed_at = ?')
          params.push(now)
        } else {
          setClauses.push('completed_at = NULL')
        }
      } else {
        setClauses.push(`${column} = ?`)
        params.push(value ?? null)
      }
    }

    params.push(id)
    runAndSave(`UPDATE tasks SET ${setClauses.join(', ')} WHERE id = ?`, params)

    return this.getById(id)!
  },

  /**
   * Alterna el estado completado/no completado de una tarea.
   */
  toggleComplete(id: string) {
    const task = this.getById(id)
    if (!task) throw new Error(`Tarea no encontrada: ${id}`)
    return this.update(id, { completed: !task.completed })
  },

  /**
   * Elimina una tarea por su ID.
   */
  delete(id: string) {
    runAndSave('DELETE FROM tasks WHERE id = ?', [id])
  },

  /**
   * Obtiene estadísticas de tareas para el dashboard.
   */
  getStats(date: string) {
    const total = queryOne('SELECT COUNT(*) as count FROM tasks WHERE date = ?', [date])
    const completed = queryOne('SELECT COUNT(*) as count FROM tasks WHERE date = ? AND completed = 1', [date])

    return {
      total: total?.count || 0,
      completed: completed?.count || 0
    }
  }
}

// ================================================================
// EVENT REPOSITORY — Operaciones de Eventos
// ================================================================

export const EventRepository = {

  /**
   * Obtiene eventos entre dos fechas (inclusive).
   */
  getByDateRange(startDate: string, endDate: string) {
    const rows = queryAll(
      `SELECT * FROM events 
       WHERE start_datetime >= ? AND start_datetime <= ?
       ORDER BY start_datetime ASC`,
      [startDate, endDate + 'T23:59:59']
    )

    return rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description || '',
      startDatetime: row.start_datetime,
      endDatetime: row.end_datetime,
      location: row.location || '',
      source: row.source || 'local',
      sourceId: row.source_id || '',
      calendarId: row.calendar_id || '',
      color: row.color || '#4F46E5',
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))
  },

  /**
   * Inserta o actualiza un evento (upsert).
   */
  upsert(event: {
    id: string
    title: string
    description?: string
    startDatetime: string
    endDatetime: string
    location?: string
    source?: string
    sourceId?: string
    calendarId?: string
    color?: string
  }) {
    const now = new Date().toISOString()

    // Verificar si existe
    const existing = queryOne('SELECT created_at FROM events WHERE id = ?', [event.id])
    const createdAt = existing ? existing.created_at : now

    runAndSave(
      `INSERT OR REPLACE INTO events 
        (id, title, description, start_datetime, end_datetime, location,
         source, source_id, calendar_id, color, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        event.id,
        event.title,
        event.description || '',
        event.startDatetime,
        event.endDatetime,
        event.location || '',
        event.source || 'local',
        event.sourceId || '',
        event.calendarId || '',
        event.color || '#4F46E5',
        createdAt,
        now
      ]
    )
  },

  /**
   * Obtiene el conteo de eventos próximos (siguiente 24 horas).
   */
  getUpcomingCount() {
    const now = new Date().toISOString()
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const result = queryOne(
      'SELECT COUNT(*) as count FROM events WHERE start_datetime >= ? AND start_datetime <= ?',
      [now, tomorrow]
    )
    return result?.count || 0
  }
}

// ================================================================
// EMAIL REPOSITORY — Cache de Correos
// ================================================================

export const EmailRepository = {

  getAll(limit = 50) {
    const rows = queryAll(
      'SELECT * FROM emails ORDER BY received_at DESC LIMIT ?',
      [limit]
    )

    return rows.map(row => ({
      id: row.id,
      subject: row.subject || '',
      senderName: row.sender_name || '',
      senderEmail: row.sender_email || '',
      snippet: row.snippet || '',
      bodyPreview: row.body_preview || '',
      isRead: row.is_read === 1,
      receivedAt: row.received_at,
      source: row.source || 'gmail',
      sourceId: row.source_id || '',
      cachedAt: row.cached_at
    }))
  },

  upsert(email: {
    id: string
    subject?: string
    senderName?: string
    senderEmail?: string
    snippet?: string
    bodyPreview?: string
    isRead?: boolean
    receivedAt: string
    source?: string
    sourceId?: string
  }) {
    const now = new Date().toISOString()

    runAndSave(
      `INSERT OR REPLACE INTO emails
        (id, subject, sender_name, sender_email, snippet, body_preview,
         is_read, received_at, source, source_id, cached_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        email.id,
        email.subject || '',
        email.senderName || '',
        email.senderEmail || '',
        email.snippet || '',
        email.bodyPreview || '',
        email.isRead ? 1 : 0,
        email.receivedAt,
        email.source || 'gmail',
        email.sourceId || '',
        now
      ]
    )
  },

  getUnreadCount() {
    const result = queryOne('SELECT COUNT(*) as count FROM emails WHERE is_read = 0')
    return result?.count || 0
  }
}

// ================================================================
// SHORTCUT REPOSITORY — Accesos Directos
// ================================================================

export const ShortcutRepository = {

  getAll() {
    const rows = queryAll('SELECT * FROM shortcuts ORDER BY sort_order ASC')
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      url: row.url,
      icon: row.icon || '🔗',
      category: row.category || '',
      sortOrder: row.sort_order || 0
    }))
  },

  create(input: { name: string; url: string; icon?: string; category?: string }) {
    const id = uuidv4()
    const maxOrder = queryOne('SELECT MAX(sort_order) as max FROM shortcuts')
    const sortOrder = (maxOrder?.max || 0) + 1

    runAndSave(
      'INSERT INTO shortcuts (id, name, url, icon, category, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      [id, input.name, input.url, input.icon || '🔗', input.category || '', sortOrder]
    )

    return { id, name: input.name, url: input.url, icon: input.icon || '🔗', category: input.category || '', sortOrder }
  },

  update(id: string, updates: Record<string, any>) {
    const setClauses: string[] = []
    const params: any[] = []

    for (const [key, value] of Object.entries(updates)) {
      const colMap: Record<string, string> = { name: 'name', url: 'url', icon: 'icon', category: 'category', sortOrder: 'sort_order' }
      const col = colMap[key]
      if (col) {
        setClauses.push(`${col} = ?`)
        params.push(value)
      }
    }

    if (setClauses.length > 0) {
      params.push(id)
      runAndSave(`UPDATE shortcuts SET ${setClauses.join(', ')} WHERE id = ?`, params)
    }

    const row = queryOne('SELECT * FROM shortcuts WHERE id = ?', [id])
    return { id: row.id, name: row.name, url: row.url, icon: row.icon, category: row.category, sortOrder: row.sort_order }
  },

  delete(id: string) {
    runAndSave('DELETE FROM shortcuts WHERE id = ?', [id])
  }
}

// ================================================================
// SETTINGS REPOSITORY — Configuración
// ================================================================

export const SettingsRepository = {

  get(key: string): string | null {
    const row = queryOne('SELECT value FROM settings WHERE key = ?', [key])
    return row ? row.value : null
  },

  set(key: string, value: string): void {
    const now = new Date().toISOString()
    runAndSave(
      'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)',
      [key, value, now]
    )
  },

  getAll(): Record<string, string> {
    const rows = queryAll('SELECT key, value FROM settings')
    const result: Record<string, string> = {}
    for (const row of rows) {
      result[row.key] = row.value
    }
    return result
  }
}
