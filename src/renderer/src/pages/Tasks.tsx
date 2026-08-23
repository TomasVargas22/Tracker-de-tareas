/**
 * Tasks.tsx — Página de gestión de tareas
 * 
 * Funcionalidades:
 * - Crear, editar, eliminar tareas
 * - Marcar como completadas con checkbox
 * - Filtrar por vista: Hoy, Semana, Todas, Completadas
 * - Formulario modal para crear/editar
 */
import React, { useState, useEffect, useRef } from 'react'
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, Filter } from 'lucide-react'
import TaskItem from '../components/TaskItem'
import TaskForm from '../components/TaskForm'
import type { Task, CreateTaskInput } from '../types'

/** Vistas disponibles para filtrar tareas */
type TaskView = 'today' | 'week' | 'all' | 'completed'

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [view, setView] = useState<TaskView>('today')
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([])

  const today = format(new Date(), 'yyyy-MM-dd')

  /**
   * Cargar tareas según la vista seleccionada
   */
  useEffect(() => {
    loadTasks()
  }, [view])

  async function loadTasks() {
    setLoading(true)
    try {
      let filters: any = {}

      switch (view) {
        case 'today':
          filters = { date: today }
          break
        case 'week':
          // Para "semana" cargamos todas y filtramos en el cliente
          filters = {}
          break
        case 'completed':
          filters = { completed: true }
          break
        case 'all':
          filters = {}
          break
      }

      let result = await window.api.getTasks(filters)

      // Filtrar por semana en el cliente
      if (view === 'week') {
        const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
        const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
        result = result.filter(t => t.date >= weekStart && t.date <= weekEnd)
      }

      setTasks(result)
    } catch (error) {
      console.error('Error al cargar tareas:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Crear o actualizar una tarea
   */
  async function handleSaveTask(data: CreateTaskInput) {
    try {
      if (editingTask) {
        // Actualizar tarea existente
        await window.api.updateTask(editingTask.id, data)
      } else {
        // Crear nueva tarea
        await window.api.createTask(data)
      }
      setShowForm(false)
      setEditingTask(null)
      loadTasks()
    } catch (error) {
      console.error('Error al guardar tarea:', error)
    }
  }

  /**
   * Alternar completado de una tarea
   */
  async function handleToggleComplete(id: string) {
    try {
      await window.api.toggleTaskComplete(id)
      loadTasks()
    } catch (error) {
      console.error('Error al completar tarea:', error)
    }
  }

  /**
   * Eliminar una tarea (con confirmación)
   */
  async function handleDeleteTask(id: string) {
    if (!confirm('¿Estás seguro de eliminar esta tarea?')) return
    try {
      await window.api.deleteTask(id)
      loadTasks()
    } catch (error) {
      console.error('Error al eliminar tarea:', error)
    }
  }

  /**
   * Abrir formulario para editar una tarea
   */
  function handleEditTask(task: Task) {
    setEditingTask(task)
    setShowForm(true)
  }

  // Separar tareas pendientes y completadas
  const pendingTasks = tasks.filter(t => !t.completed)
  const completedTasks = tasks.filter(t => t.completed)

  useEffect(() => {
    // Timeout to ensure DOM is updated before calculating width/left
    const timer = setTimeout(() => {
      const activeIndex = ['today', 'week', 'all', 'completed'].indexOf(view)
      const activeTab = tabsRef.current[activeIndex]
      if (activeTab) {
        setIndicatorStyle({
          left: activeTab.offsetLeft,
          width: activeTab.offsetWidth
        })
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [view, pendingTasks.length, tasks.length])

  return (
    <div className="animate-fade-in">
      {/* ─── Encabezado ──────────────────────────────── */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Tareas</h1>
          <p>Organiza tu día con tareas y recordatorios</p>
        </div>
        <div className="page-header-right">
          <button
            className="btn btn-primary"
            onClick={() => { setEditingTask(null); setShowForm(true) }}
          >
            <Plus size={16} />
            Nueva Tarea
          </button>
        </div>
      </div>

      {/* ─── Tabs de filtro ──────────────────────────── */}
      <div className="tabs">
        {[
          { key: 'today' as TaskView, label: 'Hoy' },
          { key: 'week' as TaskView, label: 'Esta Semana' },
          { key: 'all' as TaskView, label: 'Todas' },
          { key: 'completed' as TaskView, label: 'Completadas' },
        ].map((tab, index) => (
          <button
            key={tab.key}
            ref={el => tabsRef.current[index] = el}
            className={`tab ${view === tab.key ? 'active' : ''}`}
            onClick={() => setView(tab.key)}
          >
            {tab.label}
            {tab.key === 'today' && pendingTasks.length > 0 && view === 'today' && (
              <span style={{ marginLeft: 6, opacity: 0.7 }}>({pendingTasks.length})</span>
            )}
          </button>
        ))}
        <div
          className="tab-indicator"
          style={{
            position: 'absolute',
            bottom: '-2px',
            height: '2px',
            backgroundColor: 'var(--color-primary)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            left: indicatorStyle.left,
            width: indicatorStyle.width
          }}
        />
      </div>

      {/* ─── Lista de tareas ─────────────────────────── */}
      <div className="card">
        {tasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✅</div>
            <div className="empty-state-title">
              {view === 'completed' ? 'No hay tareas completadas' : 'No hay tareas'}
            </div>
            <div className="empty-state-text">
              {view === 'completed'
                ? 'Las tareas que completes aparecerán aquí.'
                : 'Crea tu primera tarea para empezar a organizar tu día.'}
            </div>
            {view !== 'completed' && (
              <button
                className="btn btn-primary"
                onClick={() => { setEditingTask(null); setShowForm(true) }}
              >
                <Plus size={16} />
                Crear Tarea
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Tareas pendientes */}
            {pendingTasks.length > 0 && (
              <div style={{ marginBottom: completedTasks.length > 0 ? 'var(--space-6)' : 0 }}>
                {view !== 'completed' && completedTasks.length > 0 && (
                  <div className="text-sm text-secondary font-semibold mb-4">
                    Pendientes ({pendingTasks.length})
                  </div>
                )}
                <div className="task-list">
                  {pendingTasks.map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggleComplete={handleToggleComplete}
                      onEdit={handleEditTask}
                      onDelete={handleDeleteTask}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Tareas completadas */}
            {completedTasks.length > 0 && view !== 'completed' && (
              <div>
                <div className="text-sm text-secondary font-semibold mb-4">
                  Completadas ({completedTasks.length})
                </div>
                <div className="task-list">
                  {completedTasks.map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggleComplete={handleToggleComplete}
                      onEdit={handleEditTask}
                      onDelete={handleDeleteTask}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Solo completadas (vista "Completadas") */}
            {view === 'completed' && (
              <div className="task-list">
                {tasks.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggleComplete={handleToggleComplete}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ─── Modal de formulario ─────────────────────── */}
      {showForm && (
        <TaskForm
          task={editingTask}
          onSave={handleSaveTask}
          onClose={() => { setShowForm(false); setEditingTask(null) }}
        />
      )}
    </div>
  )
}
