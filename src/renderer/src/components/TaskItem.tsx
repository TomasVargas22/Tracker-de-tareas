/**
 * TaskItem.tsx — Componente de una tarea individual
 * 
 * Muestra una tarea con:
 * - Checkbox para marcar completada
 * - Indicador de prioridad (punto de color)
 * - Título y metadatos (hora, categoría)
 * - Botones de editar/eliminar (visibles al hacer hover)
 */
import React from 'react'
import { Clock, Edit2, Trash2, Check } from 'lucide-react'
import type { Task } from '../types'

interface TaskItemProps {
  task: Task
  onToggleComplete: (id: string) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
}

export default function TaskItem({ task, onToggleComplete, onEdit, onDelete }: TaskItemProps) {
  return (
    <div className={`task-item ${task.completed ? 'completed' : ''}`}>
      {/* Checkbox de completado */}
      <button
        className={`task-checkbox ${task.completed ? 'checked' : ''}`}
        onClick={() => onToggleComplete(task.id)}
        title={task.completed ? 'Marcar como pendiente' : 'Marcar como completada'}
      >
        {task.completed && <Check size={14} />}
      </button>

      {/* Indicador de prioridad */}
      <div className={`task-priority ${task.priority}`} title={`Prioridad: ${task.priority}`} />

      {/* Contenido: título + metadatos */}
      <div className="task-content">
        <div className="task-title">{task.title}</div>
        <div className="task-meta">
          {/* Hora (si tiene) */}
          {task.time && (
            <span className="task-time">
              <Clock size={12} />
              {task.time}
            </span>
          )}
          {/* Categoría (si tiene) */}
          {task.category && (
            <span className="task-category">{task.category}</span>
          )}
        </div>
      </div>

      {/* Acciones (visibles en hover) */}
      <div className="task-actions">
        <button
          className="btn btn-ghost btn-icon"
          onClick={() => onEdit(task)}
          title="Editar tarea"
        >
          <Edit2 size={14} />
        </button>
        <button
          className="btn btn-ghost btn-icon"
          onClick={() => onDelete(task.id)}
          title="Eliminar tarea"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}
