/**
 * Calendar.tsx — Página de calendario
 * 
 * Muestra una vista de calendario mensual con:
 * - Navegación entre meses
 * - Eventos de Google Calendar (si conectado)
 * - Tareas con hora asignada
 * - Vista de día y mes
 */
import React, { useState, useEffect } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday
} from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import type { CalendarEvent, Task } from '../types'

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [syncing, setSyncing] = useState(false)

  /**
   * Cargar eventos y tareas del mes actual
   */
  useEffect(() => {
    loadMonthData()
  }, [currentDate])

  async function loadMonthData() {
    try {
      const start = format(startOfMonth(currentDate), 'yyyy-MM-dd')
      const end = format(endOfMonth(currentDate), 'yyyy-MM-dd')

      const [eventsData, tasksData] = await Promise.all([
        window.api.getEvents(start, end),
        window.api.getTasks({})
      ])

      setEvents(eventsData)
      // Filtrar tareas del mes
      setTasks(tasksData.filter(t => t.date >= start && t.date <= end))
    } catch (error) {
      console.error('Error al cargar calendario:', error)
    }
  }

  /**
   * Sincronizar con Google Calendar
   */
  async function handleSync() {
    setSyncing(true)
    try {
      await window.api.syncGoogleCalendar()
      await loadMonthData()
    } catch (error) {
      console.error('Error al sincronizar:', error)
    } finally {
      setSyncing(false)
    }
  }

  // ─── Generar los días del calendario ──────────────────
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }) // Lunes
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  // Nombres de los días de la semana
  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  /**
   * Obtener eventos y tareas para un día específico
   */
  function getItemsForDay(day: Date) {
    const dayStr = format(day, 'yyyy-MM-dd')

    const dayEvents = events.filter(e => {
      const eventDate = e.startDatetime ? format(new Date(e.startDatetime), 'yyyy-MM-dd') : ''
      return eventDate === dayStr
    })

    const dayTasks = tasks.filter(t => t.date === dayStr && !t.completed)

    return { events: dayEvents, tasks: dayTasks }
  }

  /**
   * Obtener detalles del día seleccionado
   */
  function getSelectedDayDetails() {
    if (!selectedDate) return { events: [], tasks: [] }
    return getItemsForDay(selectedDate)
  }

  const selectedDetails = getSelectedDayDetails()

  return (
    <div className="animate-fade-in">
      {/* ─── Encabezado ──────────────────────────────── */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Calendario</h1>
          <p>Visualiza tus eventos y tareas programadas</p>
        </div>
        <div className="page-header-right">
          <button
            className="btn btn-secondary"
            onClick={handleSync}
            disabled={syncing}
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Sincronizando...' : 'Sincronizar Google'}
          </button>
        </div>
      </div>

      {/* ─── Navegación del calendario ───────────────── */}
      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="calendar-header">
          <div className="calendar-nav">
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            >
              <ChevronLeft size={20} />
            </button>
            <span className="calendar-nav-title">
              {format(currentDate, 'MMMM yyyy', { locale: es })}
            </span>
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Hoy
          </button>
        </div>

        {/* ─── Grid del calendario ───────────────────── */}
        <div className="calendar-grid">
          {/* Encabezados de días */}
          {weekDays.map(day => (
            <div key={day} className="calendar-day-header">{day}</div>
          ))}

          {/* Días del calendario */}
          {calendarDays.map(day => {
            const { events: dayEvents, tasks: dayTasks } = getItemsForDay(day)
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isSelected = selectedDate && isSameDay(day, selectedDate)

            return (
              <div
                key={day.toISOString()}
                className={`calendar-day ${isToday(day) ? 'today' : ''} ${!isCurrentMonth ? 'other-month' : ''}`}
                onClick={() => setSelectedDate(day)}
                style={{
                  outline: isSelected ? '2px solid var(--color-primary)' : undefined,
                  outlineOffset: '-2px',
                  borderRadius: isSelected ? 'var(--radius-sm)' : undefined
                }}
              >
                <div className="calendar-day-number">
                  {format(day, 'd')}
                </div>
                {/* Eventos del día (máximo 3 visibles) */}
                {dayEvents.slice(0, 2).map(event => (
                  <div key={event.id} className="calendar-event" title={event.title}>
                    {event.title}
                  </div>
                ))}
                {dayTasks.slice(0, 2).map(task => (
                  <div key={task.id} className="calendar-event task" title={task.title}>
                    {task.title}
                  </div>
                ))}
                {(dayEvents.length + dayTasks.length) > 2 && (
                  <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', paddingLeft: '4px' }}>
                    +{dayEvents.length + dayTasks.length - 2} más
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── Detalles del día seleccionado ────────────── */}
      {selectedDate && (
        <div className="card animate-slide-in">
          <div className="card-header">
            <h3 className="card-title">
              {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
            </h3>
          </div>

          {selectedDetails.events.length === 0 && selectedDetails.tasks.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-6)' }}>
              <div className="empty-state-text">No hay eventos ni tareas para este día</div>
            </div>
          ) : (
            <div className="task-list">
              {selectedDetails.events.map(event => (
                <div key={event.id} className="task-item">
                  <div className="task-priority" style={{ background: event.color || '#4F46E5' }} />
                  <div className="task-content">
                    <div className="task-title">{event.title}</div>
                    <div className="task-meta">
                      <span className="task-time">
                        {event.startDatetime
                          ? `${format(new Date(event.startDatetime), 'HH:mm')} — ${format(new Date(event.endDatetime), 'HH:mm')}`
                          : 'Todo el día'}
                      </span>
                      {event.location && (
                        <span className="task-category">📍 {event.location}</span>
                      )}
                      <span className="badge badge-primary">Evento</span>
                    </div>
                  </div>
                </div>
              ))}
              {selectedDetails.tasks.map(task => (
                <div key={task.id} className="task-item">
                  <div className={`task-priority ${task.priority}`} />
                  <div className="task-content">
                    <div className="task-title">{task.title}</div>
                    <div className="task-meta">
                      {task.time && <span className="task-time">{task.time}</span>}
                      {task.category && <span className="task-category">{task.category}</span>}
                      <span className="badge badge-success">Tarea</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
