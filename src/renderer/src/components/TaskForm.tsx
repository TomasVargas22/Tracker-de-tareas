/**
 * TaskForm.tsx — Formulario para crear y editar tareas
 * 
 * Se muestra como un modal. Permite ingresar:
 * - Título (requerido)
 * - Descripción
 * - Fecha y hora
 * - Categoría (etiqueta libre)
 * - Prioridad (low, medium, high, urgent)
 * - Tiempo de recordatorio
 */
import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { Task, CreateTaskInput, TaskPriority } from '../types'

interface TaskFormProps {
  /** Tarea existente para editar (null = crear nueva) */
  task?: Task | null
  /** Callback al guardar */
  onSave: (data: CreateTaskInput) => void
  /** Callback al cerrar el modal */
  onClose: () => void
}

/** Opciones de prioridad con sus etiquetas en español */
const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'low',    label: '🟢 Baja' },
  { value: 'medium', label: '🔵 Media' },
  { value: 'high',   label: '🟡 Alta' },
  { value: 'urgent', label: '🔴 Urgente' },
]

/** Opciones de recordatorio en minutos */
const REMINDER_OPTIONS = [
  { value: 0,  label: 'Sin recordatorio' },
  { value: 5,  label: '5 minutos antes' },
  { value: 10, label: '10 minutos antes' },
  { value: 15, label: '15 minutos antes' },
  { value: 30, label: '30 minutos antes' },
  { value: 60, label: '1 hora antes' },
]

export default function TaskForm({ task, onSave, onClose }: TaskFormProps) {
  // Estado del formulario — inicializar con datos de tarea existente o vacío
  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [date, setDate] = useState(task?.date || new Date().toISOString().split('T')[0])
  const [time, setTime] = useState(task?.time || '')
  const [category, setCategory] = useState(task?.category || '')
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || 'medium')
  const [reminderBefore, setReminderBefore] = useState(task?.reminderBefore || 0)

  /**
   * Manejar envío del formulario.
   * Valida que el título no esté vacío y llama a onSave.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) return // Título obligatorio

    onSave({
      title: title.trim(),
      description: description.trim(),
      date,
      time: time || undefined,
      category: category.trim() || undefined,
      priority,
      reminderBefore: reminderBefore > 0 ? reminderBefore : undefined,
    })
  }

  /**
   * Cerrar modal al presionar Escape.
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={onClose}>
      {/* Prevenir que el clic dentro del modal lo cierre */}
      <div className="modal" onClick={e => e.stopPropagation()}>
        {/* ─── Encabezado del modal ──────────────────────── */}
        <div className="modal-header">
          <h2 className="modal-title">
            {task ? 'Editar Tarea' : 'Nueva Tarea'}
          </h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* ─── Formulario ────────────────────────────────── */}
        <form onSubmit={handleSubmit}>
          {/* Título */}
          <div className="form-group">
            <label className="form-label" htmlFor="task-title">Título *</label>
            <input
              id="task-title"
              className="form-input"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="¿Qué necesitas hacer?"
              autoFocus
              required
            />
          </div>

          {/* Descripción */}
          <div className="form-group">
            <label className="form-label" htmlFor="task-desc">Descripción</label>
            <textarea
              id="task-desc"
              className="form-textarea"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Detalles adicionales..."
              rows={3}
            />
          </div>

          {/* Fecha y Hora en fila */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="task-date">Fecha *</label>
              <input
                id="task-date"
                className="form-input"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="task-time">Hora</label>
              <input
                id="task-time"
                className="form-input"
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
              />
            </div>
          </div>

          {/* Categoría y Prioridad en fila */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="task-category">Categoría</label>
              <input
                id="task-category"
                className="form-input"
                type="text"
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="Ej: Trabajo, Personal, Estudio"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="task-priority">Prioridad</label>
              <select
                id="task-priority"
                className="form-select"
                value={priority}
                onChange={e => setPriority(e.target.value as TaskPriority)}
              >
                {PRIORITY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Recordatorio */}
          <div className="form-group">
            <label className="form-label" htmlFor="task-reminder">Recordatorio</label>
            <select
              id="task-reminder"
              className="form-select"
              value={reminderBefore}
              onChange={e => setReminderBefore(Number(e.target.value))}
            >
              {REMINDER_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Botones de acción */}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {task ? 'Guardar Cambios' : 'Crear Tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
