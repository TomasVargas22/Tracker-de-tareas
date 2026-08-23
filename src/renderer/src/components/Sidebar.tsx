/**
 * Sidebar.tsx — Barra lateral de navegación
 * 
 * Componente principal de navegación siguiendo el diseño Blomstra CRM.
 * Incluye: logo, búsqueda, menú principal, sección de reportes/config, y perfil.
 */
import React from 'react'
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Mail,
  Link2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Search,
  BarChart3,
  Zap
} from 'lucide-react'
import type { PageName } from '../types'

interface SidebarProps {
  /** Página actualmente activa */
  currentPage: PageName
  /** Callback cuando el usuario selecciona una página */
  onNavigate: (page: PageName) => void
  /** Si el sidebar está colapsado */
  collapsed: boolean
  /** Callback para toggle del sidebar */
  onToggle: () => void
  /** Conteo de correos no leídos (para mostrar badge) */
  unreadEmails?: number
  /** Conteo de tareas pendientes hoy */
  pendingTasks?: number
}

/**
 * Items del menú principal.
 * Cada uno tiene un nombre, icono de Lucide, y la página a la que navega.
 */
const MAIN_MENU_ITEMS: { page: PageName; label: string; icon: React.ReactNode }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { page: 'tasks', label: 'Tareas', icon: <CheckSquare size={20} /> },
  { page: 'calendar', label: 'Calendario', icon: <Calendar size={20} /> },
  { page: 'inbox', label: 'Correos', icon: <Mail size={20} /> },
  { page: 'shortcuts', label: 'Accesos', icon: <Link2 size={20} /> },
]

const SETTINGS_ITEMS: { page: PageName; label: string; icon: React.ReactNode }[] = [
  { page: 'settings', label: 'Configuración', icon: <Settings size={20} /> },
]

export default function Sidebar({
  currentPage,
  onNavigate,
  collapsed,
  onToggle,
  unreadEmails = 0,
  pendingTasks = 0
}: SidebarProps) {
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* ─── Encabezado con logo ────────────────────────── */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Zap size={20} />
          </div>
          <div className="sidebar-logo-text">
            Tracker <span>diario</span>
          </div>
        </div>
        <button className="sidebar-toggle" onClick={onToggle} title="Colapsar menú">
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* ─── Búsqueda ───────────────────────────────────── */}
      <div className="sidebar-search">
        <div className="sidebar-search-wrapper">
          <Search size={16} className="sidebar-search-icon" />
          <input type="text" placeholder="Buscar..." />
        </div>
      </div>

      {/* ─── Navegación principal ────────────────────────── */}
      <nav className="sidebar-nav">
        <div className="sidebar-section">
          <div className="sidebar-section-title">Menú Principal</div>
          {MAIN_MENU_ITEMS.map(item => (
            <button
              key={item.page}
              className={`sidebar-item ${currentPage === item.page ? 'active' : ''}`}
              onClick={() => onNavigate(item.page)}
            >
              <span className="sidebar-item-icon">{item.icon}</span>
              <span>{item.label}</span>
              {/* Badge para correos no leídos */}
              {item.page === 'inbox' && unreadEmails > 0 && (
                <span className="sidebar-item-badge">{unreadEmails}</span>
              )}
              {/* Badge para tareas pendientes */}
              {item.page === 'tasks' && pendingTasks > 0 && (
                <span className="sidebar-item-badge">{pendingTasks}</span>
              )}
            </button>
          ))}
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">Configuración</div>
          {SETTINGS_ITEMS.map(item => (
            <button
              key={item.page}
              className={`sidebar-item ${currentPage === item.page ? 'active' : ''}`}
              onClick={() => onNavigate(item.page)}
            >
              <span className="sidebar-item-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ─── Perfil de usuario ──────────────────────────── */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">U</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">Kaxfv</div>
            <div className="sidebar-user-role">Admin</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
