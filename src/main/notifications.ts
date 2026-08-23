/**
 * notifications.ts — Servicio de notificaciones y recordatorios
 * 
 * Maneja:
 * 1. Enviar notificaciones nativas del sistema operativo
 * 2. Programar recordatorios para tareas y eventos
 * 3. Verificar periódicamente si hay recordatorios pendientes
 */
import { Notification, BrowserWindow } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import { queryAll, runAndSave } from './database'

// Intervalo del verificador de recordatorios (en ms)
const CHECK_INTERVAL = 30 * 1000 // Cada 30 segundos

// Referencia al intervalo para poder cancelarlo
let checkIntervalId: NodeJS.Timeout | null = null

/**
 * Envía una notificación nativa del sistema operativo.
 */
export function sendNotification(title: string, body: string): void {
  if (!Notification.isSupported()) {
    console.warn('[Notificaciones] No soportadas en este sistema')
    return
  }

  const notification = new Notification({
    title,
    body,
    icon: undefined,
    silent: false
  })

  notification.on('click', () => {
    const mainWindow = BrowserWindow.getAllWindows()[0]
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  notification.show()
  console.log(`[Notificación] ${title}: ${body}`)
}

/**
 * Programa un recordatorio para una tarea.
 */
export function scheduleTaskReminder(
  taskId: string,
  taskTitle: string,
  taskDate: string,
  taskTime: string,
  minutesBefore: number
): string | null {
  if (!taskTime) return null

  const taskDatetime = new Date(`${taskDate}T${taskTime}:00`)
  const fireAt = new Date(taskDatetime.getTime() - minutesBefore * 60 * 1000)

  if (fireAt.getTime() <= Date.now()) {
    console.log(`[Recordatorio] Omitido (ya pasó): ${taskTitle}`)
    return null
  }

  const id = uuidv4()

  runAndSave(
    `INSERT INTO reminders (id, task_id, event_id, minutes_before, status, fire_at)
     VALUES (?, ?, NULL, ?, 'pending', ?)`,
    [id, taskId, minutesBefore, fireAt.toISOString()]
  )

  console.log(`[Recordatorio] Programado: "${taskTitle}" para ${fireAt.toLocaleString()}`)
  return id
}

/**
 * Inicia el verificador periódico de recordatorios.
 */
export function startReminderChecker(): void {
  if (checkIntervalId) return

  console.log('[Recordatorios] Iniciando verificador periódico')
  checkPendingReminders()
  checkIntervalId = setInterval(checkPendingReminders, CHECK_INTERVAL)
}

/**
 * Detiene el verificador de recordatorios.
 */
export function stopReminderChecker(): void {
  if (checkIntervalId) {
    clearInterval(checkIntervalId)
    checkIntervalId = null
    console.log('[Recordatorios] Verificador detenido')
  }
}

/**
 * Revisa recordatorios pendientes que ya deberían haberse disparado.
 */
function checkPendingReminders(): void {
  try {
    const now = new Date().toISOString()

    const pendingReminders = queryAll(
      `SELECT r.*, t.title as task_title, t.date as task_date, t.time as task_time
       FROM reminders r
       LEFT JOIN tasks t ON r.task_id = t.id
       WHERE r.status = 'pending' AND r.fire_at <= ?`,
      [now]
    )

    for (const reminder of pendingReminders) {
      const title = reminder.task_title || 'Recordatorio'
      const minutesText = reminder.minutes_before === 1
        ? '1 minuto'
        : `${reminder.minutes_before} minutos`

      sendNotification(
        `⏰ Recordatorio: ${title}`,
        `Comienza en ${minutesText}${reminder.task_time ? ` (${reminder.task_time})` : ''}`
      )

      runAndSave(`UPDATE reminders SET status = 'fired' WHERE id = ?`, [reminder.id])
    }

    if (pendingReminders.length > 0) {
      console.log(`[Recordatorios] ${pendingReminders.length} recordatorio(s) disparado(s)`)
    }
  } catch (error) {
    console.error('[Recordatorios] Error al verificar:', error)
  }
}

/**
 * Cancela un recordatorio específico.
 */
export function cancelReminder(reminderId: string): void {
  runAndSave(`UPDATE reminders SET status = 'dismissed' WHERE id = ?`, [reminderId])
}

/**
 * Limpia recordatorios antiguos (disparados hace más de 7 días).
 */
export function cleanOldReminders(): void {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  runAndSave(`DELETE FROM reminders WHERE status != 'pending' AND fire_at < ?`, [sevenDaysAgo])
}
