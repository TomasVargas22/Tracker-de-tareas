/**
 * ipc-handlers.ts — Manejadores de comunicación IPC
 * 
 * IPC (Inter-Process Communication) es cómo el frontend (React)
 * se comunica con el backend (Electron main process).
 * 
 * Flujo: React → preload (window.api) → ipcMain → handler → respuesta
 * 
 * Cada handler recibe los argumentos del renderer y llama al
 * repositorio o servicio correspondiente.
 */
import { ipcMain, shell } from 'electron'
import { format } from 'date-fns'
import {
  TaskRepository,
  EventRepository,
  EmailRepository,
  ShortcutRepository,
  SettingsRepository
} from './repositories'
import {
  googleLogin,
  googleLogout,
  isGoogleAuthenticated,
  fetchGoogleCalendarEvents,
  fetchGmailMessages
} from './google-services'
import { scheduleTaskReminder } from './notifications'

/**
 * Registra todos los handlers de IPC.
 * Llamar una sola vez al iniciar la app.
 */
export function registerIpcHandlers(): void {
  console.log('[IPC] Registrando handlers...')

  // ─── TAREAS ──────────────────────────────────────────────────

  /** Obtener lista de tareas con filtros opcionales */
  ipcMain.handle('tasks:getAll', (_event, filters) => {
    return TaskRepository.getAll(filters)
  })

  /** Crear una nueva tarea */
  ipcMain.handle('tasks:create', (_event, input) => {
    const task = TaskRepository.create(input)

    // Si se configuró un recordatorio, programarlo
    if (input.reminderBefore && input.time) {
      scheduleTaskReminder(
        task.id,
        task.title,
        task.date,
        task.time,
        input.reminderBefore
      )
    }

    return task
  })

  /** Actualizar una tarea existente */
  ipcMain.handle('tasks:update', (_event, id: string, updates) => {
    return TaskRepository.update(id, updates)
  })

  /** Eliminar una tarea */
  ipcMain.handle('tasks:delete', (_event, id: string) => {
    TaskRepository.delete(id)
  })

  /** Alternar completado/no completado */
  ipcMain.handle('tasks:toggleComplete', (_event, id: string) => {
    return TaskRepository.toggleComplete(id)
  })

  // ─── EVENTOS DE CALENDARIO ──────────────────────────────────

  /** Obtener eventos por rango de fechas (del cache local) */
  ipcMain.handle('events:getByRange', (_event, startDate: string, endDate: string) => {
    return EventRepository.getByDateRange(startDate, endDate)
  })

  /** Sincronizar eventos desde Google Calendar y guardar en cache */
  ipcMain.handle('events:syncGoogle', async () => {
    try {
      const events = await fetchGoogleCalendarEvents()

      // Guardar cada evento en el cache local
      for (const event of events) {
        EventRepository.upsert({
          id: event.id,
          title: event.title,
          description: event.description,
          startDatetime: event.startDatetime,
          endDatetime: event.endDatetime,
          location: event.location,
          source: 'google',
          sourceId: event.sourceId,
          calendarId: event.calendarId,
          color: event.color
        })
      }

      console.log(`[IPC] ${events.length} eventos sincronizados desde Google Calendar`)
      return events
    } catch (error) {
      console.error('[IPC] Error al sincronizar Google Calendar:', error)
      return []
    }
  })

  // ─── CORREOS ────────────────────────────────────────────────

  /** Obtener correos del cache local */
  ipcMain.handle('emails:getAll', (_event, limit?: number) => {
    return EmailRepository.getAll(limit)
  })

  /** Sincronizar correos desde Gmail y guardar en cache */
  ipcMain.handle('emails:syncGmail', async () => {
    try {
      const emails = await fetchGmailMessages()

      // Guardar cada correo en el cache local
      for (const email of emails) {
        EmailRepository.upsert({
          id: email.id,
          subject: email.subject,
          senderName: email.senderName,
          senderEmail: email.senderEmail,
          snippet: email.snippet,
          bodyPreview: email.bodyPreview,
          isRead: email.isRead,
          receivedAt: email.receivedAt,
          source: 'gmail',
          sourceId: email.sourceId
        })
      }

      console.log(`[IPC] ${emails.length} correos sincronizados desde Gmail`)
      return EmailRepository.getAll()
    } catch (error) {
      console.error('[IPC] Error al sincronizar Gmail:', error)
      return EmailRepository.getAll()
    }
  })

  // ─── ACCESOS DIRECTOS ───────────────────────────────────────

  ipcMain.handle('shortcuts:getAll', () => {
    return ShortcutRepository.getAll()
  })

  ipcMain.handle('shortcuts:create', (_event, input) => {
    return ShortcutRepository.create(input)
  })

  ipcMain.handle('shortcuts:update', (_event, id: string, updates) => {
    return ShortcutRepository.update(id, updates)
  })

  ipcMain.handle('shortcuts:delete', (_event, id: string) => {
    ShortcutRepository.delete(id)
  })

  /** Abrir un enlace en el navegador externo */
  ipcMain.handle('shortcuts:open', (_event, url: string) => {
    shell.openExternal(url)
  })

  // ─── CONFIGURACIÓN ─────────────────────────────────────────

  ipcMain.handle('settings:get', (_event, key: string) => {
    return SettingsRepository.get(key)
  })

  ipcMain.handle('settings:set', (_event, key: string, value: string) => {
    SettingsRepository.set(key, value)
  })

  // ─── GOOGLE AUTH ────────────────────────────────────────────

  ipcMain.handle('google:login', async () => {
    return await googleLogin()
  })

  ipcMain.handle('google:logout', async () => {
    await googleLogout()
  })

  ipcMain.handle('google:isAuthenticated', async () => {
    return await isGoogleAuthenticated()
  })

  // ─── UTILIDADES ─────────────────────────────────────────────

  /** Abrir URL en el navegador externo del sistema */
  ipcMain.handle('app:openExternal', (_event, url: string) => {
    shell.openExternal(url)
  })

  /** Obtener estadísticas para el dashboard */
  ipcMain.handle('app:getStats', () => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const taskStats = TaskRepository.getStats(today)
    const upcomingEvents = EventRepository.getUpcomingCount()
    const unreadEmails = EmailRepository.getUnreadCount()

    return {
      totalTasksToday: taskStats.total,
      completedTasksToday: taskStats.completed,
      upcomingEvents,
      unreadEmails,
      pendingReminders: 0, // TODO: implementar conteo de recordatorios
      completionRate: taskStats.total > 0
        ? Math.round((taskStats.completed / taskStats.total) * 100)
        : 0
    }
  })

  console.log('[IPC] Handlers registrados ✓')
}
