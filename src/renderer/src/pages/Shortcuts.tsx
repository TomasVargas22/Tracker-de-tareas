/**
 * Shortcuts.tsx — Página de accesos directos
 * 
 * Permite al usuario guardar enlaces rápidos a herramientas,
 * sitios web o aplicaciones que usa frecuentemente.
 * 
 * Funcionalidades:
 * - Grid de tarjetas de accesos directos
 * - Agregar nuevos accesos con nombre, URL e icono (emoji)
 * - Abrir enlaces en el navegador externo
 * - Eliminar accesos
 */
import React, { useState, useEffect } from 'react'
import { Plus, Trash2, ExternalLink, X } from 'lucide-react'
import type { Shortcut } from '../types'

export default function Shortcuts() {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([])
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [newIcon, setNewIcon] = useState('🔗')

  // Emojis sugeridos para accesos rápidos
  const SUGGESTED_ICONS = ['🔗', '💻', '📧', '📁', '🌐', '📊', '📝', '🎯', '⚡', '🔧', '📱', '🎨', '🗂️', '💬', '📚', '🏠']

  /**
   * Cargar accesos directos al montar
   */
  useEffect(() => {
    loadShortcuts()
  }, [])

  async function loadShortcuts() {
    try {
      const data = await window.api.getShortcuts()
      setShortcuts(data)
    } catch (error) {
      console.error('Error al cargar accesos directos:', error)
    }
  }

  /**
   * Crear un nuevo acceso directo
   */
  async function handleCreate() {
    if (!newName.trim() || !newUrl.trim()) return

    try {
      await window.api.createShortcut({
        name: newName.trim(),
        url: newUrl.trim(),
        icon: newIcon
      })
      setShowForm(false)
      setNewName('')
      setNewUrl('')
      setNewIcon('🔗')
      loadShortcuts()
    } catch (error) {
      console.error('Error al crear acceso directo:', error)
    }
  }

  /**
   * Eliminar un acceso directo
   */
  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este acceso directo?')) return
    try {
      await window.api.deleteShortcut(id)
      loadShortcuts()
    } catch (error) {
      console.error('Error al eliminar:', error)
    }
  }

  /**
   * Abrir un enlace en el navegador externo
   */
  function handleOpen(url: string) {
    window.api.openShortcut(url)
  }

  return (
    <div className="animate-fade-in">
      {/* ─── Encabezado ──────────────────────────────── */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Accesos Directos</h1>
          <p>Tus herramientas y sitios favoritos a un clic</p>
        </div>
        <div className="page-header-right">
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
          >
            <Plus size={16} />
            Nuevo Acceso
          </button>
        </div>
      </div>

      {/* ─── Grid de accesos directos ─────────────────── */}
      <div className="shortcut-grid">
        {shortcuts.map(shortcut => (
          <div
            key={shortcut.id}
            className="shortcut-card"
            onClick={() => handleOpen(shortcut.url)}
          >
            {/* Botón eliminar (visible en hover) */}
            <div className="shortcut-delete">
              <button
                className="btn btn-ghost btn-icon btn-sm"
                onClick={e => {
                  e.stopPropagation()
                  handleDelete(shortcut.id)
                }}
                title="Eliminar"
              >
                <Trash2 size={14} />
              </button>
            </div>

            <span className="shortcut-icon">{shortcut.icon}</span>
            <div className="shortcut-name">{shortcut.name}</div>
            <div className="shortcut-url">{shortcut.url}</div>
          </div>
        ))}

        {/* Tarjeta para agregar nuevo */}
        <div
          className="shortcut-card shortcut-add"
          onClick={() => setShowForm(true)}
        >
          <Plus size={32} />
          <div style={{ marginTop: 'var(--space-2)', fontWeight: 500 }}>
            Agregar Acceso
          </div>
        </div>
      </div>

      {/* ─── Modal para agregar nuevo acceso ───────────── */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Nuevo Acceso Directo</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowForm(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Selector de icono */}
            <div className="form-group">
              <label className="form-label">Icono</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {SUGGESTED_ICONS.map(icon => (
                  <button
                    key={icon}
                    className="btn btn-ghost"
                    style={{
                      fontSize: '1.5rem',
                      padding: 'var(--space-2)',
                      border: newIcon === icon ? '2px solid var(--color-primary)' : '2px solid transparent',
                      borderRadius: 'var(--radius-md)',
                      background: newIcon === icon ? 'var(--color-primary-light)' : 'transparent'
                    }}
                    onClick={() => setNewIcon(icon)}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Nombre */}
            <div className="form-group">
              <label className="form-label" htmlFor="shortcut-name">Nombre *</label>
              <input
                id="shortcut-name"
                className="form-input"
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Ej: Google Drive, Figma, GitHub"
                autoFocus
              />
            </div>

            {/* URL */}
            <div className="form-group">
              <label className="form-label" htmlFor="shortcut-url">URL *</label>
              <input
                id="shortcut-url"
                className="form-input"
                type="url"
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            {/* Botones */}
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreate}
                disabled={!newName.trim() || !newUrl.trim()}
              >
                Crear Acceso
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
