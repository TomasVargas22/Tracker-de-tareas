/**
 * Dashboard.tsx — Página principal del CRM
 * 
 * Vista unificada al abrir la app que muestra:
 * 1. Tarjetas KPI con métricas del día
 * 2. Tareas pendientes de hoy
 * 3. Próximos eventos del calendario
 * 4. Correos recientes no leídos
 * 
 * Siguiendo el diseño Blomstra CRM.
 */
import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  CheckSquare,
  Calendar,
  Mail,
  TrendingUp,
  Clock,
  ArrowRight,
  RefreshCw
} from 'lucide-react'
import KPICard from '../components/KPICard'
import TaskItem from '../components/TaskItem'
import type { Task, CalendarEvent, Email, DashboardStats, PageName } from '../types'

interface DashboardProps {
  onNavigate: (page: PageName) => void
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  // Estado para los datos del dashboard
  const [stats, setStats] = useState<DashboardStats>({
    totalTasksToday: 0,
    completedTasksToday: 0,
    upcomingEvents: 0,
    unreadEmails: 0,
    pendingReminders: 0,
    completionRate: 0
  })
  const [todayTasks, setTodayTasks] = useState<Task[]>([])
  const [recentEmails, setRecentEmails] = useState<Email[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)

  // Fecha actual formateada
  const today = format(new Date(), 'yyyy-MM-dd')
  const todayFormatted = format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es })

  /**
   * Cargar todos los datos del dashboard al montar el componente
   */
  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    setLoading(true)
    try {
      // Cargar todo en paralelo para mayor velocidad
      const [statsData, tasks, emails, events] = await Promise.all([
        window.api.getStats(),
        window.api.getTasks({ date: today }),
        window.api.getEmails(10),
        window.api.getEvents(today, today)
      ])

      setStats(statsData)
      setTodayTasks(tasks)
      setRecentEmails(emails.filter(e => !e.isRead).slice(0, 5))
      setUpcomingEvents(events.slice(0, 5))
    } catch (error) {
      console.error('Error al cargar dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Toggle completar/descompletar tarea directamente desde el dashboard
   */
  async function handleToggleTask(id: string) {
    try {
      await window.api.toggleTaskComplete(id)
      loadDashboardData() // Recargar todo
    } catch (error) {
      console.error('Error al actualizar tarea:', error)
    }
  }

  return (
    <div className="animate-fade-in">
      {/* ─── Encabezado de página ──────────────────────── */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Dashboard</h1>
          <p>Resumen de tu día — {todayFormatted}</p>
        </div>
        <div className="page-header-right">
          <div className="page-header-meta">
            <span className="dot" />
            <span>Última actualización: {format(new Date(), 'HH:mm')}</span>
          </div>
          <button className="btn btn-secondary" onClick={loadDashboardData}>
            <RefreshCw size={14} />
            Actualizar
          </button>
        </div>
      </div>

      {/* ─── Tarjetas KPI ──────────────────────────────── */}
      <div className="kpi-grid">
        <KPICard
          label="Tareas del Día"
          value={stats.totalTasksToday}
          icon={<CheckSquare size={20} />}
          iconVariant="primary"
          changeText={`${stats.completedTasksToday} completadas`}
          changePositive={true}
        />
        <KPICard
          label="Tasa de Completado"
          value={`${stats.completionRate}%`}
          icon={<TrendingUp size={20} />}
          iconVariant="success"
          changeText="del día"
          changePositive={stats.completionRate >= 50}
        />
        <KPICard
          label="Próximos Eventos"
          value={stats.upcomingEvents}
          icon={<Calendar size={20} />}
          iconVariant="warning"
          changeText="próximas 24 horas"
          changePositive={true}
        />
        <KPICard
          label="Correos No Leídos"
          value={stats.unreadEmails}
          icon={<Mail size={20} />}
          iconVariant="info"
          changeText="en bandeja"
          changePositive={stats.unreadEmails === 0}
        />
      </div>

      {/* ─── Contenido principal en grid de 2 columnas ── */}
      <div className="cards-grid">
        {/* === Tareas de Hoy === */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Tareas de Hoy</h3>
              <p className="card-subtitle">
                {todayTasks.filter(t => !t.completed).length} pendientes
              </p>
            </div>
            <button
              className="btn btn-ghost"
              onClick={() => onNavigate('tasks')}
            >
              Ver todas <ArrowRight size={14} />
            </button>
          </div>

          {todayTasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-title">Sin tareas para hoy</div>
              <div className="empty-state-text">
                ¡Disfruta tu día libre o crea nuevas tareas!
              </div>
              <button className="btn btn-primary" onClick={() => onNavigate('tasks')}>
                Crear Tarea
              </button>
            </div>
          ) : (
            <div className="task-list">
              {todayTasks.slice(0, 6).map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggleComplete={handleToggleTask}
                  onEdit={() => onNavigate('tasks')}
                  onDelete={() => {}}
                />
              ))}
            </div>
          )}
        </div>

        {/* === Correos Recientes === */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Correos Recientes</h3>
              <p className="card-subtitle">
                {recentEmails.length} no leídos
              </p>
            </div>
            <button
              className="btn btn-ghost"
              onClick={() => onNavigate('inbox')}
            >
              Ver todos <ArrowRight size={14} />
            </button>
          </div>

          {recentEmails.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📬</div>
              <div className="empty-state-title">Bandeja al día</div>
              <div className="empty-state-text">
                No hay correos nuevos. Conecta tu cuenta de Google para sincronizar.
              </div>
              <button className="btn btn-primary" onClick={() => onNavigate('settings')}>
                Conectar Google
              </button>
            </div>
          ) : (
            <div className="email-list">
              {recentEmails.map(email => (
                <div key={email.id} className="email-item unread">
                  <div className="email-avatar">
                    {email.senderName.charAt(0).toUpperCase()}
                  </div>
                  <div className="email-content">
                    <div className="email-header">
                      <span className="email-sender">{email.senderName}</span>
                      <span className="email-time">
                        {format(new Date(email.receivedAt), 'HH:mm')}
                      </span>
                    </div>
                    <div className="email-subject">{email.subject}</div>
                    <div className="email-snippet">{email.snippet}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Próximos Eventos ──────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Próximos Eventos</h3>
            <p className="card-subtitle">De tu calendario</p>
          </div>
          <button
            className="btn btn-ghost"
            onClick={() => onNavigate('calendar')}
          >
            Ver calendario <ArrowRight size={14} />
          </button>
        </div>

        {upcomingEvents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <div className="empty-state-title">Sin eventos próximos</div>
            <div className="empty-state-text">
              Conecta Google Calendar para ver tus eventos aquí.
            </div>
          </div>
        ) : (
          <div className="task-list">
            {upcomingEvents.map(event => (
              <div key={event.id} className="task-item">
                <div className="task-priority" style={{ background: event.color }} />
                <div className="task-content">
                  <div className="task-title">{event.title}</div>
                  <div className="task-meta">
                    <span className="task-time">
                      <Clock size={12} />
                      {event.startDatetime
                        ? format(new Date(event.startDatetime), 'HH:mm')
                        : 'Todo el día'}
                    </span>
                    {event.location && (
                      <span className="task-category">{event.location}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
